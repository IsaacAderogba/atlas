import { SourceRange } from "../utils/Source";

export class SyntaxError {
  readonly message: string;
  readonly sourceRange: SourceRange;
  
  constructor(message: string, sourceRange: SourceRange) {
    this.message = `syntax error: ${message}`;
    this.sourceRange = sourceRange;
  }
}
