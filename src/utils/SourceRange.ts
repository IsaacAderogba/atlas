import { SourceLocation } from "./SourceLocation";

export class SourceRange implements SourceRangeable {
  constructor(readonly start: SourceLocation, readonly end: SourceLocation) {}

  length(): number {
    if (this.start.line === this.end.line) {
      return this.end.column - this.start.column;
    }

    // TODO: improve handling of multiline errors
    return 1;
  }

  sourceRange(): SourceRange {
    return this;
  }
}

export interface SourceRangeable {
  sourceRange(): SourceRange;
}
