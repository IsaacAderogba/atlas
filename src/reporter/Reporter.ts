import { SourceMessage, SourceRange } from "../errors/SourceError";

export interface Reporter {
  log(message: string): void;
  error(message: string): void;
  rangeError(range: SourceRange, message: SourceMessage): void;
}
