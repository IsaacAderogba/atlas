import { SyntaxError } from "../errors/SyntaxError";
import { Expr } from "./Expr";
import { Token } from "./Token";

interface BaseStmt {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class BlockStmt {
  constructor(readonly statements: Stmt[]) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
  }
}

export class VarStmt implements BaseStmt {
  constructor(readonly name: Token, readonly initializer: Expr) {}

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

export class ErrorStmt implements BaseStmt {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorStmt should not be executed.");
  }
}

export type Stmt = BlockStmt | VarStmt | ExpressionStmt | PrintStmt | ErrorStmt;

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
  visitErrorStmt?(stmt: ErrorStmt): T;
}
