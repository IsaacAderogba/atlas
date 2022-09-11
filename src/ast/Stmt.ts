import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { SyntaxError } from "../errors/SyntaxError";
import type { Expr } from "./Expr";
import type { Property } from "./Node";
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

export class ClassStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly open: Token,
    readonly properties: Property[],
    readonly statics: Property[],
    readonly close: Token
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(start, end);
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
    console.log("error", this.error);
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
  constructor(readonly keyword: Token, readonly property: Property) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.property.sourceRange();
    return new SourceRange(start, end);
  }
}

export class WhileStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly condition: Expr,
    readonly increment: Expr | undefined,
    readonly body: Stmt
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
  | ClassStmt
  | ContinueStmt
  | ErrorStmt
  | IfStmt
  | ReturnStmt
  | VarStmt
  | WhileStmt
  | ExpressionStmt;

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitBreakStmt(stmt: BreakStmt): T;
  visitClassStmt(stmt: ClassStmt): T;
  visitContinueStmt(stmt: ContinueStmt): T;
  visitErrorStmt?(stmt: ErrorStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitIfStmt(stmt: IfStmt): T;
  visitReturnStmt(stmt: ReturnStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitWhileStmt(stmt: WhileStmt): T;
}
