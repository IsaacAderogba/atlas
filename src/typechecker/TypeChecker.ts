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
  ReturnStmt,
  Stmt,
  StmtVisitor,
  TypeStmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { TypeCheckError } from "../errors/TypeCheckError";
import { Interpreter } from "../runtime/Interpreter";

export class TypeChecker implements ExprVisitor<void>, StmtVisitor<void> {
  private errors: TypeCheckError[] = [];

  constructor(
    private readonly interpreter: Interpreter,
    private readonly statements: Stmt[]
  ) {}

  typeCheck(): { errors: TypeCheckError[] } {
    // for (const statement of this.statements) {
    //   this.typeCheckStmt(statement);
    // }

    return { errors: this.errors };
  }

  private typeCheckStmt(statement: Stmt): void {
    statement.accept(this);
  }

  private typeCheckExpr(expression: Expr): void {
    expression.accept(this);
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

  visitAssignExpr(_expr: AssignExpr): void {
    throw new Error("Method not implemented.");
  }

  visitBinaryExpr(_expr: BinaryExpr): void {
    throw new Error("Method not implemented.");
  }

  visitCallExpr(_expr: CallExpr): void {
    throw new Error("Method not implemented.");
  }

  visitFunctionExpr(_expr: FunctionExpr): void {
    throw new Error("Method not implemented.");
  }

  visitGetExpr(_expr: GetExpr): void {
    throw new Error("Method not implemented.");
  }

  visitTernaryExpr(_expr: TernaryExpr): void {
    throw new Error("Method not implemented.");
  }

  visitGroupingExpr(_expr: GroupingExpr): void {
    throw new Error("Method not implemented.");
  }

  visitLiteralExpr(_expr: LiteralExpr): void {
    throw new Error("Method not implemented.");
  }

  visitListExpr(_expr: ListExpr): void {
    throw new Error("Method not implemented.");
  }

  visitLogicalExpr(_expr: LogicalExpr): void {
    throw new Error("Method not implemented.");
  }

  visitRecordExpr(_expr: RecordExpr): void {
    throw new Error("Method not implemented.");
  }

  visitSetExpr(_expr: SetExpr): void {
    throw new Error("Method not implemented.");
  }

  visitThisExpr(_expr: ThisExpr): void {
    throw new Error("Method not implemented.");
  }

  visitUnaryExpr(_expr: UnaryExpr): void {
    throw new Error("Method not implemented.");
  }

  visitVariableExpr(_expr: VariableExpr): void {
    throw new Error("Method not implemented.");
  }
}
