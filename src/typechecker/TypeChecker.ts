/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  FunctionExpr,
  GetExpr,
  GroupingExpr,
  ListExpr,
  LiteralExpr,
  LogicalExpr,
  RecordExpr,
  SetExpr,
  TernaryExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
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
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError, TypeCheckErrors } from "../errors/TypeCheckError";
import { Interpreter } from "../runtime/Interpreter";
import Types, { AtlasType } from "../primitives/AtlasType";

export class TypeChecker implements ExprVisitor<AtlasType>, StmtVisitor<void> {
  private errors: TypeCheckError[] = [];

  typeCheck(statements: Stmt[]): { errors: TypeCheckError[] } {
    // for (const statement of this.statements) {
    //   this.typeCheckStmt(statement);
    // }

    try {
      return { errors: this.errors };
    } catch (errs) {
      return { errors: this.errors };
    }
  }

  typeCheckStmt(statement: Stmt): void {
    statement.accept(this);
  }

  typeCheckExpr(expression: Expr): AtlasType {
    return expression.accept(this);
  }

  visitBlockStmt(_stmt: BlockStmt): void {
    throw new Error("Method not implemented.");
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

  visitExpressionStmt(_stmt: ExpressionStmt): void {
    throw new Error("Method not implemented.");
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

  visitVarStmt(_stmt: VarStmt): void {
    throw new Error("Method not implemented.");
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

  visitBinaryExpr(_expr: BinaryExpr): AtlasType {
    throw new Error("Method not implemented.");
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

  visitLogicalExpr(_expr: LogicalExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitRecordExpr(expr: RecordExpr): AtlasType {
    const properties = expr.entries.map(entry => ({
      name: entry.key.lexeme,
      type: this.typeCheckExpr(entry.value),
    }));

    return Types.Record(properties);
  }

  visitSetExpr(_expr: SetExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitThisExpr(_expr: ThisExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitUnaryExpr(_expr: UnaryExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  visitVariableExpr(_expr: VariableExpr): AtlasType {
    throw new Error("Method not implemented.");
  }

  private error(
    source: SourceRangeable,
    message: SourceMessage
  ): TypeCheckError {
    const error = new TypeCheckError(message, source.sourceRange());
    this.errors.push(error);
    return error;
  }
}
