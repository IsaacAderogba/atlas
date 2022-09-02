import { SourceRange } from "../utils/Source";

export interface Reporter {
  log(message: string): void;
  error(message: string): void;
  rangeError(source: string, range: SourceRange, message: string): void;
}
