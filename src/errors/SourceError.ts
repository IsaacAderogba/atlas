export interface SourceError {
  sourceRange: SourceRange;
  sourceMessage: SourceMessage;
}

export class SourceRange implements SourceRangeable {
  constructor(
    readonly file: SourceFile,
    readonly start: SourceLocation,
    readonly end: SourceLocation
  ) {}

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

export interface SourceLocation {
  line: number;
  column: number;
}

export interface SourceFile {
  source: string;
  module: string;
}

export interface SourceMessage {
  title: string;
  body: string;
  type: "error" | "warning";
}
