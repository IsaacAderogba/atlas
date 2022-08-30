import { SourceRange } from "../utils/SourceRange";

export interface Reporter {
  report(message: string): void;
  reportError(message: string): void;
  reportErrorRange(source: string, range: SourceRange, message: string): void;
}
