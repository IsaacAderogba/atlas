import { SyntaxError } from "../errors/SyntaxError";
import { AtlasValue } from "../interpreter/AtlasValue";
import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { Token } from "./Token";
import { Parameter } from "./Node";
import type { BlockStmt } from "./Stmt";

interface BaseExpr extends SourceRangeable {
  accept<T>(visitor: ExprVisitor<T>): T;
}

export class AssignExpr implements BaseExpr {
  constructor(readonly name: Token, readonly value: Expr) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitAssignExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.name.sourceRange().start;
    const end = this.value.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class TernaryExpr implements BaseExpr {
  constructor(
    readonly expression: Expr,
    readonly thenBranch: Expr,
    readonly elseBranch: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitTernaryExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.expression.sourceRange().start;
    const end = this.elseBranch.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class BinaryExpr implements BaseExpr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.left.sourceRange().start;
    const end = this.right.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class CallExpr implements BaseExpr {
  constructor(
    readonly open: Token,
    readonly callee: Expr,
    readonly args: Expr[],
    readonly close: Token
  ) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.open.sourceRange().start;
    const end = this.close.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class FunctionExpr implements BaseExpr {
  constructor(
    readonly keyword: Token,
    readonly params: Parameter[],
    readonly body: BlockStmt
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitFunctionExpr(this);
  }

  sourceRange(): SourceRange {
    const { start } = this.keyword.sourceRange();
    const { end } = this.body.sourceRange();
    return new SourceRange(start, end);
  }
}

export class GetExpr implements BaseExpr {
  constructor(readonly object: Expr, readonly name: Token) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitGetExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.object.sourceRange().start;
    const end = this.name.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class GroupingExpr implements BaseExpr {
  constructor(
    readonly open: Token,
    readonly expression: Expr,
    readonly close: Token
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.open.sourceRange().start;
    const end = this.close.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class SetExpr {
  constructor(
    readonly object: Expr,
    readonly name: Token,
    readonly value: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitSetExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.object.sourceRange().start;
    const end = this.value.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class ThisExpr {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitThisExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.keyword.sourceRange().start;
    const end = this.keyword.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class UnaryExpr implements BaseExpr {
  constructor(readonly operator: Token, readonly right: Expr) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.operator.sourceRange().start;
    const end = this.right.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class LiteralExpr implements BaseExpr {
  constructor(readonly token: Token, readonly value: AtlasValue) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.token.sourceRange().start;
    const end = this.token.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class LogicalExpr implements BaseExpr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitLogicalExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.left.sourceRange().start;
    const end = this.right.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class ErrorExpr implements BaseExpr {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorExpr should not be evaluated.");
  }

  sourceRange(): SourceRange {
    return this.error.sourceRange;
  }
}

export class VariableExpr {
  constructor(readonly name: Token) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitVariableExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.name.sourceRange().start;
    const end = this.name.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export type Expr =
  | AssignExpr
  | TernaryExpr
  | BinaryExpr
  | CallExpr
  | ErrorExpr
  | FunctionExpr
  | GetExpr
  | GroupingExpr
  | LiteralExpr
  | LogicalExpr
  | SetExpr
  | ThisExpr
  | UnaryExpr
  | VariableExpr;

export interface ExprVisitor<T> {
  visitAssignExpr(expr: AssignExpr): T;
  visitBinaryExpr(expr: BinaryExpr): T;
  visitCallExpr(expr: CallExpr): T;
  visitFunctionExpr(expr: FunctionExpr): T;
  visitGetExpr(expr: GetExpr): T;
  visitTernaryExpr(expr: TernaryExpr): T;
  visitGroupingExpr(expr: GroupingExpr): T;
  visitLiteralExpr(expr: LiteralExpr): T;
  visitLogicalExpr(expr: LogicalExpr): T;
  visitSetExpr(expr: SetExpr): T;
  visitThisExpr(expr: ThisExpr): T;
  visitUnaryExpr(expr: UnaryExpr): T;
  visitVariableExpr(expr: VariableExpr): T;
}
