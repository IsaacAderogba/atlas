import { SourceRange } from "../utils/SourceRange";

export class SyntaxError {
  constructor(readonly message: string, readonly sourceRange: SourceRange) {}
}
