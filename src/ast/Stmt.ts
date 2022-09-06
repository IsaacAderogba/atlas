import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { SyntaxError } from "../errors/SyntaxError";
import { Expr } from "./Expr";
import { Parameter } from "./Node";
import { Token } from "./Token";

interface BaseStmt extends SourceRangeable {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class BlockStmt implements BaseStmt {
  constructor(
    readonly open: Token,
    readonly statements: Stmt[],
    readonly close: Token
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.open.sourceRange();
    const { end } = this.open.sourceRange();
    return new SourceRange(start, end);
  }
}

export class BreakStmt implements BaseStmt {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBreakStmt(this);
  }

  sourceRange(): SourceRange {
    return this.keyword.sourceRange();
  }
}

export class ContinueStmt implements BaseStmt {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitContinueStmt(this);
  }

  sourceRange(): SourceRange {
    return this.keyword.sourceRange();
  }
}

export class ErrorStmt implements BaseStmt {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorStmt should not be executed.");
  }

  sourceRange(): SourceRange {
    return this.error.sourceRange;
  }
}

export class ExpressionStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }

  sourceRange(): SourceRange {
    return this.expression.sourceRange();
  }
}

export class FunctionStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly params: Parameter[],
    readonly body: BlockStmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitFunctionStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.body.sourceRange();
    return new SourceRange(start, end);
  }
}

export class IfStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch?: Stmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitIfStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();

    if (this.elseBranch) {
      return new SourceRange(start, this.elseBranch.sourceRange().end);
    } else {
      return new SourceRange(start, this.thenBranch.sourceRange().end);
    }
  }
}

export class ReturnStmt implements BaseStmt {
  constructor(readonly keyword: Token, readonly value: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitReturnStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(start, end);
  }
}

export class VarStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly initializer: Expr
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.initializer.sourceRange();
    return new SourceRange(start, end);
  }
}

export class WhileStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly condition: Expr,
    readonly increment: Expr | undefined,
    readonly body: Stmt,
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitWhileStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.body.sourceRange();
    return new SourceRange(start, end);
  }
}

export type Stmt =
  | BlockStmt
  | BreakStmt
  | ContinueStmt
  | ErrorStmt
  | FunctionStmt
  | IfStmt
  | ReturnStmt
  | VarStmt
  | WhileStmt
  | ExpressionStmt;

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitBreakStmt(stmt: BreakStmt): T;
  visitContinueStmt(stmt: ContinueStmt): T;
  visitErrorStmt?(stmt: ErrorStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitFunctionStmt(stmt: FunctionStmt): T;
  visitIfStmt(stmt: IfStmt): T;
  visitReturnStmt(stmt: ReturnStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitWhileStmt(stmt: WhileStmt): T;
}
