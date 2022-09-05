import { SyntaxError } from "../errors/SyntaxError";
import { AtlasValue } from "../interpreter/AtlasValue";
import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { Token } from "./Token";

interface BaseExpr extends SourceRangeable {
  accept<T>(visitor: ExprVisitor<T>): T;
  sourceRange(): SourceRange;
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
    readonly callee: Expr,
    readonly args: Expr[],
    readonly closingParen: Token
  ) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.callee.sourceRange().start;
    const end = this.closingParen.sourceRange().end;
    return new SourceRange(start, end);
  }
}

export class GroupingExpr implements BaseExpr {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.expression.sourceRange().start;
    const end = this.expression.sourceRange().end;
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
  constructor(readonly value: AtlasValue, readonly token: Token) {}

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
  constructor(
    readonly error: SyntaxError,
    readonly token: Token,
    readonly expression: Expr
  ) {}

  accept<T>(): T {
    throw new Error("ErrorExpr should not be evaluated.");
  }

  sourceRange(): SourceRange {
    const start = this.token.sourceRange().start;
    const end = this.expression.sourceRange().end;
    return new SourceRange(start, end);
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
  | GroupingExpr
  | LiteralExpr
  | LogicalExpr
  | UnaryExpr
  | ErrorExpr
  | VariableExpr;

export interface ExprVisitor<T> {
  visitAssignExpr(expr: AssignExpr): T;
  visitBinaryExpr(expr: BinaryExpr): T;
  visitCallExpr(expr: CallExpr): T;
  visitTernaryExpr(expr: TernaryExpr): T;
  visitGroupingExpr(expr: GroupingExpr): T;
  visitLiteralExpr(expr: LiteralExpr): T;
  visitLogicalExpr(expr: LogicalExpr): T;
  visitUnaryExpr(expr: UnaryExpr): T;
  visitVariableExpr(expr: VariableExpr): T;
}
