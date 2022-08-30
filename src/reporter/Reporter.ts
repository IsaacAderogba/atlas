import { SourceRange } from "../utils/SourceRange";

export interface Reporter {
  report(message: string): void;
  reportError(message: string): void;
  reportRangeError(source: string, range: SourceRange, message: string): void;
}
