import { SourceRange } from "../utils/Source";

export class RuntimeError {
  readonly message: string;
  readonly sourceRange: SourceRange;

  constructor(message: string, sourceRange: SourceRange) {
    this.message = `runtime error: ${message}`;
    this.sourceRange = sourceRange;
  }
}
