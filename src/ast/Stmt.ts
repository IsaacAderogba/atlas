import { Expr } from "./Expr";
import { Token } from "./Token";

interface BaseStmt {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class VarStmt implements BaseStmt {
  constructor(
      readonly name: Token,
      readonly initializer: Expr | null,
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
      return visitor.visitVarStmt(this);
  }
}

export class ExpressionStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class PrintStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}

export type Stmt = VarStmt | ExpressionStmt | PrintStmt;

export interface StmtVisitor<T> {
  visitVarStmt(stmt: VarStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
}
