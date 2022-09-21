import { SourceError } from "./errors/SourceError";
import { Reader } from "./parser/Reader";
import { Reporter } from "./reporter/Reporter";

export interface AtlasAPI {
  reporter: Reporter;
  reader: Reader;
  // scanner
  // parser
  // analyzer
  // typechecker
  // interpreter

  // main(args: string[]): void;
  // runFile(path: string): void;
  // runPrompt(): void;
  // run(file: SourceFile): AtlasStatus;
  // check(file: SourceFile): { status: AtlasStatus; statements: Stmt[] };
  // parse(file: SourceFile): Stmt[];
  reportErrors(errors: SourceError[]): boolean
}