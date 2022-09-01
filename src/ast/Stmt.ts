import { Expr } from "./Expr";

interface BaseStmt {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class ExpressionStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class PrintStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export interface StmtVisitor<T> {
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
}
