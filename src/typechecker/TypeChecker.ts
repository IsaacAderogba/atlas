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
import { SourceRange } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { isAnyType } from "../primitives/AnyType";
import { isCallableType } from "../primitives/AtlasCallable";
import { AtlasString } from "../primitives/AtlasString";
import { Types, AtlasType } from "../primitives/AtlasType";
import { isInterfaceType } from "../primitives/InterfaceType";
import { ClassType, FunctionEnum, VariableState } from "../utils/Enums";
import { TypeCheckerLookup } from "./TypeCheckerLookup";
import { CurrentFunction, TypeVisitor } from "./TypeUtils";
import { TypeCheckerSubtyper } from "./TypeCheckerSubtyper";

export class TypeChecker implements TypeVisitor {
  readonly lookup = new TypeCheckerLookup(this);
  readonly subtyper = new TypeCheckerSubtyper(this);
  currentFunction?: CurrentFunction;
  currentClass = ClassType.NONE;

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    this.lookup.beginScope(this.lookup.globalScope);
    for (const statement of statements) {
      this.acceptStmt(statement);
    }
    this.lookup.endScope();

    return { errors: this.subtyper.errors };
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

  visitClassStmt({ name, properties, typeExpr, parameters }: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    const classType = Types.Class.init(name.lexeme);
    this.lookup.defineValue(name, classType);
    this.lookup.defineType(name, classType, VariableState.SETTLED);
    this.lookup.beginScope();

    // prepare for type synthesis and checking
    classType.generics = this.lookup.defineGenerics(parameters);
    const fields: Property[] = [];
    const methods: Property[] = [];
    for (const prop of properties) {
      const props = isFunctionExpr(prop.initializer) ? methods : fields;
      props.push(prop);
    }

    // type check and define fields in scope
    for (const prop of fields) {
      classType.setProp(prop.name.lexeme, this.visitProperty(prop));
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
        : this.subtyper.error(
            name,
            TypeCheckErrors.requiredFunctionAnnotation()
          );
      classType.setProp(name.lexeme, value);
    }

    // with all functions typed, we can finally check them
    for (const prop of methods) {
      const isInit = prop.name.lexeme === "init";
      const method = isInit ? FunctionEnum.INIT : FunctionEnum.METHOD;
      classType.setProp(prop.name.lexeme, this.visitProperty(prop, method));
    }

    // assert the type if an `implements` keyword was used
    if (typeExpr) {
      this.subtyper.check(
        new SourceRange(name.sourceRange().start, typeExpr.sourceRange().end),
        classType,
        this.acceptTypeExpr(typeExpr)
      );
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
    this.subtyper.check(stmt.condition, conditionActual, Types.Boolean);

    this.acceptStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.acceptStmt(stmt.elseBranch);
  }

  visitInterfaceStmt(stmt: InterfaceStmt): void {
    this.lookup.beginScope();
    const generics = this.lookup.defineGenerics(stmt.parameters);
    const interfaceType = Types.Interface.init(stmt.name.lexeme, {}, generics);
    stmt.entries.forEach(({ key, value }) => {
      const type = this.acceptTypeExpr(value);
      this.lookup.defineType(key, type, VariableState.SETTLED);
      interfaceType.setProp(key.lexeme, type);
    });
    this.lookup.endScope();

    this.lookup.defineType(stmt.name, interfaceType, VariableState.SETTLED);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = this.acceptExpr(stmt.value, this.currentFunction?.expected);
    if (this.currentFunction && this.currentFunction.returns) {
      this.currentFunction.returns = Types.Union.init([
        this.currentFunction.returns,
        value,
      ]);
    } else if (this.currentFunction) {
      this.currentFunction.returns = value;
    }
  }

  visitVarStmt(stmt: VarStmt): void {
    this.visitProperty(stmt.property, FunctionEnum.FUNCTION);
  }

  visitTypeStmt(stmt: TypeStmt): void {
    this.lookup.beginScope();

    const alias = Types.Alias.init(
      stmt.name.lexeme,
      this.acceptTypeExpr(stmt.type),
      this.lookup.defineGenerics(stmt.parameters)
    );

    this.lookup.endScope();
    this.lookup.defineType(stmt.name, alias);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    const conditionActual = this.acceptExpr(stmt.condition);
    this.subtyper.check(stmt.condition, conditionActual, Types.Boolean);
    this.acceptStmt(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): AtlasType {
    const expected = this.lookup.value(expr.name);
    const actual = this.acceptExpr(expr.value, expected);
    return this.subtyper.check(expr.value, actual, expected);
  }

  visitBinaryExpr(expr: BinaryExpr): AtlasType {
    return this.subtyper.synthesize(
      this.acceptExpr(expr.left),
      this.acceptExpr(expr.right),
      (left, right) => {
        switch (expr.operator.type) {
          case "HASH":
            this.subtyper.check(expr.left, left, Types.String);
            this.subtyper.check(expr.right, right, Types.String);
            return Types.String;
          case "PLUS":
          case "MINUS":
          case "SLASH":
          case "STAR":
            this.subtyper.check(expr.left, left, Types.Number);
            this.subtyper.check(expr.right, right, Types.Number);
            return Types.Number;
          case "GREATER":
          case "GREATER_EQUAL":
          case "LESS":
          case "LESS_EQUAL":
            this.subtyper.check(expr.left, left, Types.Number);
            this.subtyper.check(expr.right, right, Types.Number);
            return Types.Boolean;
          case "EQUAL_EQUAL":
          case "BANG_EQUAL":
            return Types.Boolean;
          default:
            return this.subtyper.error(
              expr.operator,
              TypeCheckErrors.unexpectedBinaryOperator()
            );
        }
      }
    );
  }

  visitCallExpr({ callee, open, close, args }: CallExpr): AtlasType {
    return this.subtyper.synthesize(this.acceptExpr(callee), calleeType => {
      if (isAnyType(calleeType)) return calleeType;
      if (!isCallableType(calleeType)) {
        return this.subtyper.error(
          callee,
          TypeCheckErrors.expectedCallableType()
        );
      }

      if (calleeType.arity() !== args.length) {
        return this.subtyper.error(
          new SourceRange(open, close),
          TypeCheckErrors.mismatchedArity(calleeType.arity(), args.length)
        );
      }

      calleeType.params.forEach((expected, i) => {
        const actual = this.acceptExpr(args[i], expected);
        this.subtyper.check(args[i], actual, expected);
      });

      return calleeType.returns;
    });
  }

  visitFunctionExpr(
    expr: FunctionExpr,
    expected = this.subtyper.error(
      expr,
      TypeCheckErrors.requiredFunctionAnnotation()
    )
  ): AtlasType {
    return this.visitFunction({
      expr,
      enumType: FunctionEnum.FUNCTION,
      expected,
    });
  }

  visitGetExpr(expr: GetExpr): AtlasType {
    return this.visitField(expr);
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
        throw this.subtyper.error(
          expr,
          TypeCheckErrors.unexpectedLiteralType(expr.value.type)
        );
    }
  }

  visitListExpr(_expr: ListExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitLogicalExpr(expr: LogicalExpr): AtlasType {
    return this.subtyper.synthesize(
      this.acceptExpr(expr.left),
      this.acceptExpr(expr.right),
      (left, right) => {
        switch (expr.operator.type) {
          case "OR":
          case "AND":
            this.subtyper.check(expr.left, left, Types.Boolean);
            this.subtyper.check(expr.right, right, Types.Boolean);
            return Types.Boolean;
          default:
            return this.subtyper.error(
              expr.operator,
              TypeCheckErrors.unexpectedLogicalOperator()
            );
        }
      }
    );
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
    const expected = this.visitField(expr);
    const actual = this.acceptExpr(expr.value, expected);
    return this.subtyper.check(expr.value, actual, expected);
  }

  visitThisExpr(expr: ThisExpr): AtlasType {
    return this.lookup.value(expr.keyword);
  }

  visitUnaryExpr(expr: UnaryExpr): AtlasType {
    return this.subtyper.synthesize(this.acceptExpr(expr.right), right => {
      switch (expr.operator.type) {
        case "BANG":
          this.subtyper.check(expr.right, right, Types.Boolean);
          return Types.Boolean;
        case "MINUS":
          this.subtyper.check(expr.right, right, Types.Number);
          return Types.Number;
        default:
          return this.subtyper.error(
            expr.operator,
            TypeCheckErrors.unexpectedUnaryOperator()
          );
      }
    });
  }

  visitVariableExpr(expr: VariableExpr): AtlasType {
    return this.lookup.value(expr.name);
  }

  visitCallableTypeExpr(typeExpr: CallableTypeExpr): AtlasType {
    this.lookup.beginScope();
    const generics = this.lookup.defineGenerics(typeExpr.params);
    const params = typeExpr.paramTypes.map(p => this.acceptTypeExpr(p));
    const returns = this.acceptTypeExpr(typeExpr.returnType);
    this.lookup.endScope();
    return Types.Function.init({ params, returns }, generics);
  }

  visitCompositeTypeExpr(typeExpr: CompositeTypeExpr): AtlasType {
    switch (typeExpr.operator.type) {
      case "PIPE":
        return Types.Union.init([
          this.acceptTypeExpr(typeExpr.left),
          this.acceptTypeExpr(typeExpr.right),
        ]);
      case "AMPERSAND":
        return Types.Intersection.init([
          this.acceptTypeExpr(typeExpr.left),
          this.acceptTypeExpr(typeExpr.right),
        ]);
      default:
        return this.subtyper.error(
          typeExpr.operator,
          TypeCheckErrors.unexpectedCompositeOperator()
        );
    }
  }

  visitGenericTypeExpr(typeExpr: GenericTypeExpr): AtlasType {
    const genericType = this.lookup.type(typeExpr.name);
    const args = typeExpr.typeExprs.map(expr => this.acceptTypeExpr(expr));

    if (genericType.generics.length !== args.length) {
      return this.subtyper.error(
        typeExpr,
        TypeCheckErrors.mismatchedArity(
          genericType.generics.length,
          args.length
        )
      );
    }

    // const genericParamMap = 
  }

  visitSubTypeExpr(typeExpr: SubTypeExpr): AtlasType {
    return this.lookup.type(typeExpr.name);
  }

  // utils
  visitField({ name, object }: GetExpr | SetExpr): AtlasType {
    return this.subtyper.synthesize(this.acceptExpr(object), objectType => {
      const memberType = objectType.get(name);
      if (memberType) return memberType;
      return this.subtyper.error(
        name,
        TypeCheckErrors.unknownProperty(name.lexeme)
      );
    });
  }

  private visitProperty(
    { initializer: expr, name, type }: Property,
    enumType: FunctionEnum = FunctionEnum.FUNCTION
  ): AtlasType {
    if (isFunctionExpr(expr) && type) {
      const expected = this.acceptTypeExpr(type);
      this.lookup.declareValue(name, expected);
      const value = this.visitFunction({ expr, enumType, expected });

      return this.lookup.defineValue(name, value);
    } else if (isFunctionExpr(expr)) {
      return this.subtyper.error(
        expr,
        TypeCheckErrors.requiredFunctionAnnotation()
      );
    } else {
      const expected = type ? this.acceptTypeExpr(type) : undefined;
      let actual = this.acceptExpr(expr, expected);
      if (expected) actual = this.subtyper.check(expr, actual, expected);

      return this.lookup.defineValue(name, actual);
    }
  }

  private visitFunction(current: CurrentFunction): AtlasType {
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
    return this.subtyper.check(expr, actual, expected);
  }
}
