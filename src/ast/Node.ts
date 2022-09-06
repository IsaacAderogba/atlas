import { SourceRange } from "../errors/SourceError";
import type { SourceRangeable } from "../errors/SourceError";
import type { Expr } from "./Expr";
import type { Token } from "./Token";

interface BaseNode extends SourceRangeable {}

export class Parameter implements BaseNode {
  constructor(readonly name: Token) {}

  sourceRange(): SourceRange {
    return this.name.sourceRange();
  }
}

export class Field implements BaseNode {
  constructor(readonly name: Token, readonly initializer: Expr) {}

  sourceRange(): SourceRange {
    const { start } = this.name.sourceRange();
    const { end } = this.initializer.sourceRange();
    return new SourceRange(start, end);
  }
}
