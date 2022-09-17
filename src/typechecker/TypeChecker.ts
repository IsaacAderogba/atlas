/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AssignExpr,
  BinaryExpr,
  CallableTypeExpr,
  CallExpr,
  CompositeTypeExpr,
  Expr,
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
  TypeStmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import {
  SourceMessage,
  SourceRange,
  SourceRangeable,
} from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { isAnyType } from "../primitives/AnyType";
import { isCallableType } from "../primitives/AtlasCallable";
import { AtlasString } from "../primitives/AtlasString";
import { Types, AtlasType } from "../primitives/AtlasType";
import { isInterfaceType } from "../primitives/InterfaceType";
import { ClassType, FunctionEnum, VariableState } from "../utils/Enums";
import { TypeCheckerLookup } from "./TypeCheckerLookup";
import { CurrentFunction, TypeVisitor } from "./TypeUtils";

export class TypeChecker implements TypeVisitor {
  private readonly lookup = new TypeCheckerLookup(this);
  private errors: TypeCheckError[] = [];
  currentFunction?: CurrentFunction;
  currentClass = ClassType.NONE;

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    this.lookup.beginScope(this.lookup.globalScope);
    for (const statement of statements) {
      this.acceptStmt(statement);
    }
    this.lookup.endScope();

    return { errors: this.errors };
  }

  acceptStmt(statement: Stmt): void {
    statement.accept(this);
  }

  acceptExpr(expression: Expr, expectedType?: AtlasType): AtlasType {
    return expression.accept(this, expectedType);
  }

  acceptTypeExpr(typeExpr: TypeExpr, expectedType?: AtlasType): AtlasType {
    return typeExpr.accept(this, expectedType);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.lookup.beginScope();
    for (const statement of stmt.statements) this.acceptStmt(statement);
    this.lookup.endScope();
  }

  visitBreakStmt(_stmt: BreakStmt): void {
    // no op
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    const classType = Types.Class.init(stmt.name.lexeme);
    this.lookup.defineValue(stmt.name, classType);
    this.lookup.settleType(stmt.name, classType);
    this.lookup.beginScope();

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
    this.lookup.getScope().valueScope.set("this", thisInstance);
    this.lookup.getScope().typeScope.set("this", {
      type: thisInstance,
      state: VariableState.SETTLED,
    });

    // *only* type functions
    for (const { type, name } of methods) {
      const value = type
        ? this.acceptTypeExpr(type)
        : this.error(name, TypeCheckErrors.requiredFunctionAnnotation());
      classType.setProp(name.lexeme, value);
    }

    // with all functions typed, we can finally check them
    for (const prop of methods) {
      const isInit = prop.name.lexeme === "init";
      const method = isInit ? FunctionEnum.INIT : FunctionEnum.METHOD;
      classType.setProp(prop.name.lexeme, this.checkProperty(prop, method));
    }

    this.lookup.endScope();
    this.currentClass = enclosingClass;
  }

  visitContinueStmt(_stmt: ContinueStmt): void {
    // no op
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.acceptExpr(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    const conditionActual = this.acceptExpr(stmt.condition);
    this.checkSubtype(stmt.condition, conditionActual, Types.Boolean);

    this.acceptStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.acceptStmt(stmt.elseBranch);
  }

  visitInterfaceStmt(stmt: InterfaceStmt): void {
    const interfaceType = Types.Interface.init(stmt.name.lexeme);

    this.lookup.beginScope();
    stmt.entries.forEach(({ key, value }) => {
      const type = this.acceptTypeExpr(value);
      this.lookup.settleType(key, type);
      interfaceType.setProp(key.lexeme, type);
    });
    this.lookup.endScope();

    this.lookup.settleType(stmt.name, interfaceType);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = this.acceptExpr(stmt.value, this.currentFunction?.expected);
    if (this.currentFunction) this.currentFunction.returns = value;
  }

  visitVarStmt(stmt: VarStmt): void {
    this.checkProperty(stmt.property, FunctionEnum.FUNCTION);
  }

  visitTypeStmt(stmt: TypeStmt): void {
    this.lookup.defineType(stmt.name, this.acceptTypeExpr(stmt.type));
  }

  visitWhileStmt(stmt: WhileStmt): void {
    const conditionActual = this.acceptExpr(stmt.condition);
    this.checkSubtype(stmt.condition, conditionActual, Types.Boolean);
    this.acceptStmt(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): AtlasType {
    const expected = this.lookup.value(expr.name);
    const actual = this.acceptExpr(expr.value, expected);
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
        this.acceptExpr(expr.left);
        this.acceptExpr(expr.right);
        return Types.Boolean;
      default:
        return this.error(
          expr.operator,
          TypeCheckErrors.unexpectedBinaryOperator()
        );
    }
  }

  visitCallExpr({ callee, open, close, args }: CallExpr): AtlasType {
    const calleeType = this.acceptExpr(callee);

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
    return this.lookup.field(expr);
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

  visitRecordExpr(expr: RecordExpr, expected?: AtlasType): AtlasType {
    const entries: { [key: string]: AtlasType } = {};

    const type = expected && isInterfaceType(expected) ? expected : undefined;
    expr.entries.forEach(({ key, value }) => {
      const token = key.clone({ lexeme: (key.literal as AtlasString).value });
      entries[token.lexeme] = this.acceptExpr(value, type?.get(token));
    });

    return Types.Record.init(entries);
  }

  visitSetExpr(expr: SetExpr): AtlasType {
    const expected = this.lookup.field(expr);
    return this.checkExprSubtype(expr.value, expected);
  }

  visitThisExpr(expr: ThisExpr): AtlasType {
    return this.lookup.value(expr.keyword);
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
    return this.lookup.value(expr.name);
  }

  visitCallableTypeExpr(typeExpr: CallableTypeExpr): AtlasType {
    this.lookup.beginScope();
    const params = typeExpr.paramTypes.map(p => this.acceptTypeExpr(p));
    const returns = this.acceptTypeExpr(typeExpr.returnType);
    this.lookup.endScope();
    return Types.Function.init({ params, returns });
  }

  visitCompositeTypeExpr(_typeExpr: CompositeTypeExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitGenericTypeExpr(_typeExpr: GenericTypeExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitSubTypeExpr(typeExpr: SubTypeExpr): AtlasType {
    return this.lookup.type(typeExpr.name);
  }

  private checkProperty(
    { initializer: expr, name, type }: Property,
    enumType: FunctionEnum = FunctionEnum.FUNCTION
  ): AtlasType {
    if (isFunctionExpr(expr) && type) {
      const expected = this.acceptTypeExpr(type);
      this.lookup.declareValue(name, expected);
      const value = this.checkFunction({ expr, enumType, expected });
      this.lookup.defineValue(name, value);
      return value;
    } else if (isFunctionExpr(expr)) {
      return this.error(expr, TypeCheckErrors.requiredFunctionAnnotation());
    } else {
      let narrowed: AtlasType;
      if (type) {
        narrowed = this.checkExprSubtype(expr, this.acceptTypeExpr(type));
      } else {
        narrowed = this.acceptExpr(expr);
      }

      this.lookup.defineValue(name, narrowed);
      return narrowed;
    }
  }

  private checkFunction(current: CurrentFunction): AtlasType {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = current;
    this.lookup.beginScope();

    const { expr, expected } = current;

    const expectedParams = isCallableType(expected) ? expected.params : [];
    const params = expr.params.map(({ name }, i) => {
      this.lookup.defineValue(name, expectedParams[i] || Types.Any);
      return expectedParams[i] || Types.Any;
    });

    for (const statement of expr.body.statements) this.acceptStmt(statement);

    const returns =
      this.currentClass === ClassType.CLASS &&
      this.currentFunction.enumType === FunctionEnum.INIT
        ? this.lookup.scopedValue("this")
        : this.currentFunction.returns;

    const actual = Types.Function.init({
      params,
      returns: returns || Types.Null,
    });

    this.lookup.endScope();
    this.currentFunction = enclosingFunction;

    return this.checkSubtype(expr, actual, expected);
  }

  private checkExprSubtype(expr: Expr, expectedType: AtlasType): AtlasType {
    const actualType = this.acceptExpr(expr, expectedType);
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

  error(source: SourceRangeable, message: SourceMessage): AtlasType {
    const error = new TypeCheckError(message, source.sourceRange());
    this.errors.push(error);
    return Types.Any;
  }
}
