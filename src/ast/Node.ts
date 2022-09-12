import { SourceRange } from "../errors/SourceError";
import type { SourceRangeable } from "../errors/SourceError";
import type { Expr, TypeExpr } from "./Expr";
import type { Token } from "./Token";

interface BaseNode extends SourceRangeable {}

export class Parameter implements BaseNode {
  constructor(readonly name: Token) {}

  sourceRange(): SourceRange {
    return this.name.sourceRange();
  }
}

export class Property implements BaseNode {
  constructor(
    readonly name: Token,
    readonly type: TypeExpr | undefined,
    readonly initializer: Expr
  ) {}

  sourceRange(): SourceRange {
    const { start } = this.name.sourceRange();
    const { end } = this.initializer.sourceRange();
    return new SourceRange(start, end);
  }
}

export class Entry implements BaseNode {
  constructor(readonly key: Token, readonly value: Expr) {}

  sourceRange(): SourceRange {
    const { start } = this.key.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(start, end);
  }
}

export class TypeEntry implements BaseNode {
  constructor(readonly key: Token, readonly value: TypeExpr) {}

  sourceRange(): SourceRange {
    const { start } = this.key.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(start, end);
  }
}
