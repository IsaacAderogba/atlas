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
  ErrorStmt,
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
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { typeGlobals } from "../globals";
import { AtlasString } from "../primitives/AtlasString";
import Types, { AtlasType } from "../primitives/AtlasType";
import { ClassType, FunctionType, VariableState } from "../utils/Enums";
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

  private currentFunction = FunctionType.NONE;
  private currentClass = ClassType.NONE;
  private errors: TypeCheckError[] = [];

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    this.withScope(() => {
      for (const statement of statements) {
        this.checkStmt(statement);
      }
    }, this.globalScope);

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
    this.withScope(() => {
      for (const statement of stmt.statements) this.checkStmt(statement);
    });
  }

  visitBreakStmt(_stmt: BreakStmt): void {
    throw new Error("Method not implemented.");
  }

  visitClassStmt(_stmt: ClassStmt): void {
    throw new Error("Method not implemented.");
  }

  visitContinueStmt(_stmt: ContinueStmt): void {
    throw new Error("Method not implemented.");
  }

  visitErrorStmt?(_stmt: ErrorStmt): void {
    throw new Error("Method not implemented.");
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.checkExpr(stmt.expression);
  }

  visitIfStmt(_stmt: IfStmt): void {
    throw new Error("Method not implemented.");
  }

  visitInterfaceStmt(_stmt: InterfaceStmt): void {
    throw new Error("Method not implemented.");
  }

  visitReturnStmt(_stmt: ReturnStmt): void {
    throw new Error("Method not implemented.");
  }

  visitVarStmt(stmt: VarStmt): void {
    this.typeCheckProperty(stmt.property, FunctionType.FUNCTION);
  }

  private typeCheckProperty(
    { initializer, name, type }: Property,
    _funcType: FunctionType
  ): void {
    if (initializer instanceof FunctionExpr) {
      // todo
      return;
    }

    let narrowed: AtlasType;
    if (type) {
      narrowed = this.checkExprSubtype(initializer, this.checkTypeExpr(type));
    } else {
      narrowed = this.checkExpr(initializer);
    }

    this.defineValue(name, narrowed);
  }

  visitTypeStmt(_stmt: TypeStmt): void {
    throw new Error("Method not implemented.");
  }

  visitWhileStmt(_stmt: WhileStmt): void {
    throw new Error("Method not implemented.");
  }

  visitAssignExpr(_expr: AssignExpr): AtlasType {
    throw new Error("Method not implemented.");
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

  visitCallExpr(_expr: CallExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitFunctionExpr(_expr: FunctionExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitGetExpr(_expr: GetExpr): AtlasType {
    throw new Error("Method not implemented.");
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
    const properties = expr.entries.map(entry => ({
      name: (entry.key.literal as AtlasString).value,
      type: this.checkExpr(entry.value),
    }));

    return Types.Record.init(properties);
  }

  visitSetExpr(_expr: SetExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitThisExpr(_expr: ThisExpr): AtlasType {
    throw new Error("Method not implemented.");
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

  visitCallableTypeExpr(_typeExpr: CallableTypeExpr): AtlasType {
    throw new Error("Method not implemented.");
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

  lookupValue(name: Token): AtlasType {
    for (const scope of this.scopes) {
      const type = scope.valueScope.get(name.lexeme);
      if (type) return type;
    }

    const type = this.globalScope.valueScope.get(name.lexeme);
    if (type) return type;

    return this.error(name, TypeCheckErrors.undefinedValue(name.lexeme));
  }

  lookupType(name: Token): AtlasType {
    for (const scope of this.scopes) {
      const entry = scope.typeScope.get(name.lexeme);
      if (entry) return entry.type;
    }

    const entry = this.globalScope.typeScope.get(name.lexeme);
    if (entry) return entry.type;

    return this.error(name, TypeCheckErrors.undefinedType(name.lexeme));
  }

  private checkExprSubtype(expr: Expr, expectedType: AtlasType): AtlasType {
    const actualType = this.checkExpr(expr);
    return this.checkSubtype(expr, actualType, expectedType);
  }

  private checkSubtype(
    expr: Expr | TypeExpr,
    actual: AtlasType,
    expected: AtlasType
  ): AtlasType {
    if (actual.isSubtype(expected)) return expected;

    return this.error(
      expr,
      TypeCheckErrors.invalidSubtype(expected.type, actual.type)
    );
  }

  private defineValue(name: Token, type: AtlasType): void {
    this.getScope().valueScope.set(name.lexeme, type);
  }

  private withScope(
    onScope: () => void,
    newScope = new TypeCheckerScope()
  ): void {
    this.scopes.push(newScope);

    onScope();

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
