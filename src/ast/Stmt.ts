import { SyntaxError } from "../errors/SyntaxError";
import { Expr } from "./Expr";
import { Parameter } from "./Node";
import { Token } from "./Token";

interface BaseStmt {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class BlockStmt implements BaseStmt {
  constructor(readonly statements: Stmt[]) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
  }
}

export class BreakStmt implements BaseStmt {
  constructor(readonly token: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBreakStmt(this);
  }
}

export class ContinueStmt implements BaseStmt {
  constructor(readonly token: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitContinueStmt(this);
  }
}

export class ErrorStmt implements BaseStmt {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorStmt should not be executed.");
  }
}

export class ExpressionStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class FunctionStmt {
  constructor(
    readonly name: Token,
    readonly params: Parameter[],
    readonly body: BlockStmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitFunctionStmt(this);
  }
}

export class PrintStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}

export class IfStmt implements BaseStmt {
  constructor(
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch?: Stmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitIfStmt(this);
  }
}

export class VarStmt implements BaseStmt {
  constructor(readonly name: Token, readonly initializer: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }
}

export class WhileStmt {
  constructor(
    readonly condition: Expr,
    readonly body: Stmt,
    readonly increment: Expr | undefined
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitWhileStmt(this);
  }
}

export type Stmt =
  | BlockStmt
  | BreakStmt
  | ContinueStmt
  | ErrorStmt
  | FunctionStmt
  | IfStmt
  | VarStmt
  | WhileStmt
  | ExpressionStmt
  | PrintStmt;

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitBreakStmt(stmt: BreakStmt): T;
  visitContinueStmt(stmt: ContinueStmt): T;
  visitErrorStmt?(stmt: ErrorStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitFunctionStmt(stmt: FunctionStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
  visitIfStmt(stmt: IfStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitWhileStmt(stmt: WhileStmt): T;
}
