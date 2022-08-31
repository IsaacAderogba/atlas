import { AtlasValue } from "../runtime/AtlasValue";
import { SourceRange } from "../utils/SourceRange";
import { Token } from "./Token";

interface BaseExpr {
  accept<T>(visitor: ExprVisitor<T>): T;
  sourceRange(): SourceRange;
}

export class TernaryExpr implements BaseExpr {
  constructor(readonly expression: Expr, readonly thenBranch: Expr, readonly elseBranch: Expr) {}

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
  constructor(readonly left: Expr, readonly operator: Token, readonly right: Expr) {}

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }

  sourceRange(): SourceRange {
    const start = this.left.sourceRange().start;
    const end = this.right.sourceRange().end;
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

export type Expr = BinaryExpr | GroupingExpr | LiteralExpr | UnaryExpr;

export interface ExprVisitor<T> {
  visitTernaryExpr(expr: TernaryExpr): T;
  visitBinaryExpr(expr: BinaryExpr): T;
  visitGroupingExpr(expr: GroupingExpr): T;
  visitLiteralExpr(expr: LiteralExpr): T;
  visitUnaryExpr(expr: UnaryExpr): T;
}
