import { SourceRange } from "../utils/SourceRange";

export class RuntimeError {
  constructor(readonly message: string, readonly sourceRange: SourceRange) {}
}
