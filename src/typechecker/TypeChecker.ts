/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AssignExpr,
  BinaryExpr,
  CallableTypeExpr,
  CallExpr,
  CompositeTypeExpr,
  Expr,
  ExprVisitor,
  FunctionExpr,
  GenericTypeExpr,
  GetExpr,
  GroupingExpr,
  isFunctionExpr,
  ListExpr,
  LiteralExpr,
  LogicalExpr,
  RecordExpr,
  SetExpr,
  SubTypeExpr,
  TernaryExpr,
  ThisExpr,
  TypeExpr,
  TypeExprVisitor,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import { Property } from "../ast/Node";
import {
  BlockStmt,
  BreakStmt,
  ClassStmt,
  ContinueStmt,
  ExpressionStmt,
  IfStmt,
  InterfaceStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  TypeStmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { Token } from "../ast/Token";
import {
  SourceMessage,
  SourceRange,
  SourceRangeable,
} from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { typeGlobals } from "../globals";
import { isAnyType } from "../primitives/AnyType";
import { isCallableType } from "../primitives/AtlasCallable";
import { AtlasString } from "../primitives/AtlasString";
import { Types, AtlasType } from "../primitives/AtlasType";
import { ClassType, FunctionEnum, VariableState } from "../utils/Enums";
import { Scope } from "../utils/Scope";
import { Stack } from "../utils/Stack";

class TypeCheckerScope {
  readonly typeScope: Scope<{
    type: AtlasType;
    state: VariableState;
    source?: SourceRangeable;
  }>;
  readonly valueScope: Scope<AtlasType>;

  constructor({
    typeScope = new Scope(),
    valueScope = new Scope(),
  }: Partial<TypeCheckerScope> = {}) {
    this.typeScope = typeScope;
    this.valueScope = valueScope;
  }
}

type CurrentFunction = {
  enumType: FunctionEnum;
  expr: FunctionExpr;
  expected: AtlasType;
  returns?: AtlasType;
};

export class TypeChecker
  implements
    ExprVisitor<AtlasType>,
    TypeExprVisitor<AtlasType>,
    StmtVisitor<void>
{
  private readonly scopes: Stack<TypeCheckerScope> = new Stack();
  private readonly globalScope = new TypeCheckerScope({
    typeScope: Scope.fromGlobals(Types, (_, type) => ({
      type,
      state: VariableState.SETTLED,
    })),
    valueScope: Scope.fromGlobals(typeGlobals, (_, type) => type),
  });

  private currentFunction?: CurrentFunction;
  private currentClass = ClassType.NONE;
  private errors: TypeCheckError[] = [];

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    this.beginScope(this.globalScope);
    for (const statement of statements) {
      this.checkStmt(statement);
    }
    this.endScope();

    return { errors: this.errors };
  }

  checkStmt(statement: Stmt): void {
    statement.accept(this);
  }

  checkExpr(expression: Expr): AtlasType {
    return expression.accept(this);
  }

  checkTypeExpr(typeExpr: TypeExpr): AtlasType {
    return typeExpr.accept(this);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    for (const statement of stmt.statements) this.checkStmt(statement);
    this.endScope();
  }

  visitBreakStmt(_stmt: BreakStmt): void {
    // no op
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    const classType = Types.Class.init(stmt.name.lexeme);
    this.defineValue(stmt.name, classType);
    this.settleType(stmt.name, classType);
    this.beginScope();

    // prepare for type synthesis and checking
    const fields: Property[] = [];
    const methods: Property[] = [];
    for (const prop of stmt.properties) {
      const props = isFunctionExpr(prop.initializer) ? methods : fields;
      props.push(prop);
    }

    // type check and define fields in scope
    for (const prop of fields) {
      classType.setProp(prop.name.lexeme, this.checkProperty(prop));
    }

    // create this type now that fields have been bound
    const thisInstance = classType.returns;
    this.getScope().valueScope.set("this", thisInstance);
    this.getScope().typeScope.set("this", {
      type: thisInstance,
      state: VariableState.SETTLED,
    });

    // *only* type functions
    for (const { type, name } of methods) {
      const value = type
        ? this.checkTypeExpr(type)
        : this.error(name, TypeCheckErrors.requiredFunctionAnnotation());
      classType.setProp(name.lexeme, value);
    }

    // with all functions typed, we can finally check them
    for (const prop of methods) {
      const isInit = prop.name.lexeme === "init";
      const method = isInit ? FunctionEnum.INIT : FunctionEnum.METHOD;
      classType.setProp(prop.name.lexeme, this.checkProperty(prop, method));
    }

    this.endScope();
    this.currentClass = enclosingClass;
  }

  visitContinueStmt(_stmt: ContinueStmt): void {
    // no op
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.checkExpr(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    const conditionActual = this.checkExpr(stmt.condition);
    this.checkSubtype(stmt.condition, conditionActual, Types.Boolean);

    this.checkStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.checkStmt(stmt.elseBranch);
  }

  visitInterfaceStmt(stmt: InterfaceStmt): void {
    const interfaceType = Types.Interface.init(stmt.name.lexeme);

    this.beginScope();
    stmt.entries.forEach(({ key, value }) => {
      const type = this.checkTypeExpr(value);
      this.settleType(key, type);
      interfaceType.setProp(key.lexeme, type);
    });
    this.endScope();

    this.settleType(stmt.name, interfaceType);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = this.checkExpr(stmt.value);
    if (this.currentFunction) this.currentFunction.returns = value;
  }

  visitVarStmt(stmt: VarStmt): void {
    this.checkProperty(stmt.property, FunctionEnum.FUNCTION);
  }

  private checkProperty(
    { initializer: expr, name, type }: Property,
    enumType: FunctionEnum = FunctionEnum.FUNCTION
  ): AtlasType {
    if (isFunctionExpr(expr) && type) {
      const expected = this.checkTypeExpr(type);
      this.declareValue(name, expected);
      const value = this.checkFunction({ expr, enumType, expected });
      this.defineValue(name, value);
      return value;
    } else if (isFunctionExpr(expr)) {
      return this.error(expr, TypeCheckErrors.requiredFunctionAnnotation());
    } else {
      let narrowed: AtlasType;
      if (type) {
        narrowed = this.checkExprSubtype(expr, this.checkTypeExpr(type));
      } else {
        narrowed = this.checkExpr(expr);
      }

      this.defineValue(name, narrowed);
      return narrowed;
    }
  }

  private checkFunction(current: CurrentFunction): AtlasType {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = current;
    this.beginScope();

    const { expr, expected } = current;

    const expectedParams = isCallableType(expected) ? expected.params : [];
    const params = expr.params.map(({ name }, i) => {
      this.defineValue(name, expectedParams[i] || Types.Any);
      return expectedParams[i] || Types.Any;
    });

    for (const statement of expr.body.statements) this.checkStmt(statement);

    const returns =
      this.currentClass === ClassType.CLASS &&
      this.currentFunction.enumType === FunctionEnum.INIT
        ? this.lookupScopedValue("this")
        : this.currentFunction.returns;

    const actual = Types.Function.init({
      params,
      returns: returns || Types.Null,
    });

    this.endScope();
    this.currentFunction = enclosingFunction;

    return this.checkSubtype(expr, actual, expected);
  }

  visitTypeStmt(stmt: TypeStmt): void {
    this.defineType(stmt.name, this.checkTypeExpr(stmt.type));
  }

  visitWhileStmt(stmt: WhileStmt): void {
    const conditionActual = this.checkExpr(stmt.condition);
    this.checkSubtype(stmt.condition, conditionActual, Types.Boolean);
    this.checkStmt(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): AtlasType {
    const expected = this.lookupValue(expr.name);
    const actual = isFunctionExpr(expr.value)
      ? this.visitFunctionExpr(expr.value, expected)
      : this.checkExpr(expr.value);
    return this.checkSubtype(expr.value, actual, expected);
  }

  visitBinaryExpr(expr: BinaryExpr): AtlasType {
    switch (expr.operator.type) {
      case "HASH":
        this.checkExprSubtype(expr.left, Types.String);
        this.checkExprSubtype(expr.right, Types.String);
        return Types.String;
      case "PLUS":
      case "MINUS":
      case "SLASH":
      case "STAR":
        this.checkExprSubtype(expr.left, Types.Number);
        this.checkExprSubtype(expr.right, Types.Number);
        return Types.Number;
      case "GREATER":
      case "GREATER_EQUAL":
      case "LESS":
      case "LESS_EQUAL":
        this.checkExprSubtype(expr.left, Types.Number);
        this.checkExprSubtype(expr.right, Types.Number);
        return Types.Boolean;
      case "EQUAL_EQUAL":
      case "BANG_EQUAL":
        this.checkExpr(expr.left);
        this.checkExpr(expr.right);
        return Types.Boolean;
      default:
        return this.error(
          expr.operator,
          TypeCheckErrors.unexpectedBinaryOperator()
        );
    }
  }

  visitCallExpr({ callee, open, close, args }: CallExpr): AtlasType {
    const calleeType = this.checkExpr(callee);

    if (isAnyType(calleeType)) return calleeType;
    if (!isCallableType(calleeType)) {
      return this.error(callee, TypeCheckErrors.expectedCallableType());
    }

    if (calleeType.arity() !== args.length) {
      return this.error(
        new SourceRange(open, close),
        TypeCheckErrors.mismatchedArity(calleeType.arity(), args.length)
      );
    }

    calleeType.params.forEach((type, i) => {
      const expr = args[i];
      if (isFunctionExpr(expr)) {
        this.visitFunctionExpr(expr, type);
      } else {
        this.checkExprSubtype(expr, type);
      }
    });

    return calleeType.returns;
  }

  visitFunctionExpr(
    expr: FunctionExpr,
    expected = this.error(expr, TypeCheckErrors.requiredFunctionAnnotation())
  ): AtlasType {
    return this.checkFunction({
      expr,
      enumType: FunctionEnum.FUNCTION,
      expected,
    });
  }

  visitGetExpr(expr: GetExpr): AtlasType {
    return this.lookupField(expr);
  }

  visitTernaryExpr(_expr: TernaryExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitGroupingExpr(_expr: GroupingExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasType {
    switch (expr.value.type) {
      case "Null":
        return Types.Null;
      case "Boolean":
        return Types.Boolean;
      case "Number":
        return Types.Number;
      case "String":
        return Types.String;
      default:
        throw this.error(
          expr,
          TypeCheckErrors.unexpectedLiteralType(expr.value.type)
        );
    }
  }

  visitListExpr(_expr: ListExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitLogicalExpr(expr: LogicalExpr): AtlasType {
    switch (expr.operator.type) {
      case "OR":
      case "AND":
        this.checkExprSubtype(expr.left, Types.Boolean);
        this.checkExprSubtype(expr.right, Types.Boolean);
        return Types.Boolean;
      default:
        return this.error(
          expr.operator,
          TypeCheckErrors.unexpectedLogicalOperator()
        );
    }
  }

  visitRecordExpr(expr: RecordExpr): AtlasType {
    const entries: { [key: string]: AtlasType } = {};

    expr.entries.forEach(({ key, value }) => {
      entries[(key.literal as AtlasString).value] = this.checkExpr(value);
    });

    return Types.Record.init(entries);
  }

  visitSetExpr(expr: SetExpr): AtlasType {
    const expected = this.lookupField(expr);
    return this.checkExprSubtype(expr.value, expected);
  }

  visitThisExpr(expr: ThisExpr): AtlasType {
    return this.lookupValue(expr.keyword);
  }

  visitUnaryExpr(expr: UnaryExpr): AtlasType {
    switch (expr.operator.type) {
      case "BANG":
        this.checkExprSubtype(expr.right, Types.Boolean);
        return Types.Boolean;
      case "MINUS":
        this.checkExprSubtype(expr.right, Types.Number);
        return Types.Number;
      default:
        return this.error(
          expr.operator,
          TypeCheckErrors.unexpectedUnaryOperator()
        );
    }
  }

  visitVariableExpr(expr: VariableExpr): AtlasType {
    return this.lookupValue(expr.name);
  }

  visitCallableTypeExpr(typeExpr: CallableTypeExpr): AtlasType {
    this.beginScope();
    const params = typeExpr.paramTypes.map(p => this.checkTypeExpr(p));
    const returns = this.checkTypeExpr(typeExpr.returnType);
    this.endScope();
    return Types.Function.init({ params, returns });
  }

  visitCompositeTypeExpr(_typeExpr: CompositeTypeExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitGenericTypeExpr(_typeExpr: GenericTypeExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitSubTypeExpr(typeExpr: SubTypeExpr): AtlasType {
    return this.lookupType(typeExpr.name);
  }

  private lookupValue(name: Token): AtlasType {
    const type = this.lookupScopedValue(name.lexeme);
    if (type) return type;
    return this.error(name, TypeCheckErrors.undefinedValue(name.lexeme));
  }

  private lookupType(name: Token): AtlasType {
    for (const scope of this.scopes) {
      const entry = scope.typeScope.get(name.lexeme);
      if (entry) return this.settleType(name, entry.type);
    }

    const entry = this.globalScope.typeScope.get(name.lexeme);
    if (entry) return this.settleType(name, entry.type);

    return this.error(name, TypeCheckErrors.undefinedType(name.lexeme));
  }

  private lookupScopedValue(name: string): AtlasType | undefined {
    for (const scope of this.scopes) {
      const type = scope.valueScope.get(name);
      if (type) return type;
    }

    const type = this.globalScope.valueScope.get(name);
    if (type) return type;

    return undefined;
  }

  private lookupField({ name, object }: GetExpr | SetExpr): AtlasType {
    const objectType = this.checkExpr(object);
    const memberType = objectType.get(name);
    if (memberType) return memberType;
    return this.error(name, TypeCheckErrors.undefinedProperty(name.lexeme));
  }

  private checkExprSubtype(expr: Expr, expectedType: AtlasType): AtlasType {
    const actualType = this.checkExpr(expr);
    console.log("expr", actualType, expectedType)
    return this.checkSubtype(expr, actualType, expectedType);
  }

  private checkSubtype(
    source: SourceRangeable,
    actual: AtlasType,
    expected: AtlasType
  ): AtlasType {
    if (actual.isSubtype(expected)) return expected;

    return this.error(
      source,
      TypeCheckErrors.invalidSubtype(expected.toString(), actual.toString())
    );
  }

  private defineType(name: Token, type: AtlasType): void {
    const scope = this.getScope();

    if (scope.typeScope.has(name.lexeme)) {
      this.error(name, TypeCheckErrors.prohibitedTypeRedeclaration());
    } else {
      scope.typeScope.set(name.lexeme, {
        type,
        source: name,
        state: VariableState.DEFINED,
      });
    }
  }

  private settleType(name: Token, type: AtlasType): AtlasType {
    this.getScope().typeScope.set(name.lexeme, {
      type,
      state: VariableState.SETTLED,
      source: name,
    });
    return type;
  }

  private declareValue(name: Token, type: AtlasType): void {
    this.getScope().valueScope.set(name.lexeme, type);
  }

  private defineValue(name: Token, type: AtlasType): void {
    this.getScope().valueScope.set(name.lexeme, type);
  }

  private beginScope(newScope = new TypeCheckerScope()): void {
    this.scopes.push(newScope);
  }

  private endScope(): void {
    const scope = this.scopes.pop();
    if (scope && this.currentClass === ClassType.NONE) {
      for (const { state, source } of scope.typeScope.values()) {
        if (state === VariableState.DEFINED && source) {
          this.error(source, TypeCheckErrors.unusedType());
        }
      }
    }
  }

  private getScope(): TypeCheckerScope {
    const scope = this.scopes.peek();
    if (!scope) throw new Error("Expected scope");
    return scope;
  }

  private error(source: SourceRangeable, message: SourceMessage): AtlasType {
    const error = new TypeCheckError(message, source.sourceRange());
    this.errors.push(error);
    return Types.Any;
  }
}
