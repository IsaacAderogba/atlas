import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { Token } from "./Token";

interface BaseNode extends SourceRangeable {
  sourceRange(): SourceRange;
}

export class Parameter implements BaseNode {
  constructor(readonly name: Token) {}

  sourceRange(): SourceRange {
    return this.name.sourceRange();
  }
}
