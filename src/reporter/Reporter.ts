import { SourceMessage, SourceRange } from "../errors/SourceError";

export interface ReporterAPI {
  log(message: string): void;
  error(message: string): void;
  rangeError(source: string, range: SourceRange, message: SourceMessage): void;
}
