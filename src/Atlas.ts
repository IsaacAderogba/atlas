import fs from "fs";
import readline from "readline";
import { Stmt } from "./ast/Stmt";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Interpreter } from "./runtime/Interpreter";
import { AtlasStatus } from "./utils/AtlasStatus";
import { Analyzer } from "./analyzer/Analyzer";
import { SourceError } from "./errors/SourceError";
import { ConsoleReporter } from "./reporter/ConsoleReporter";
import { TypeChecker } from "./typechecker/TypeChecker";
import { ReporterAPI } from "./reporter/Reporter";

interface AtlasAPI {
  reporter: ReporterAPI;
  // scanner
  // parser
  // analyzer
  // typechecker
  // interpreter

  main(args: string[]): void;
  runFile(path: string): void;
  runPrompt(): void;
  run(source: string): AtlasStatus;
  check(source: string): { status: AtlasStatus; statements: Stmt[] };
  parse(source: string): Stmt[];
  readModule(source: string): string;
  reportErrors(source: string, errors: SourceError[]): boolean 
}

export class Atlas implements AtlasAPI {
  reporter = new ConsoleReporter();
  interpreter = new Interpreter();
  typechecker = new TypeChecker();

  main(args: string[]): void {
    if (args.length > 1) {
      console.log("Usage: atlas [script]");
      process.exit(64);
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  runFile(path: string): void {
    const status = this.run(this.readModule(path));

    switch (status) {
      case AtlasStatus.STATIC_ERROR:
        return process.exit(65);
      case AtlasStatus.RUNTIME_ERROR:
        return process.exit(70);
      case AtlasStatus.SUCCESS:
        return process.exit(0);
    }
  }

  runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("> ");
    rl.prompt();
    rl.on("line", input => {
      this.run(input);
      rl.prompt();
    });
  }

  run(source: string): AtlasStatus {
    const { status, statements } = this.check(source);
    if (status !== AtlasStatus.VALID) return status;

    const { errors } = this.interpreter.interpret(statements);

    if (errors.length) {
      errors.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.sourceMessage)
      );
      return AtlasStatus.RUNTIME_ERROR;
    }

    return AtlasStatus.SUCCESS;
  }

  check(source: string): { status: AtlasStatus; statements: Stmt[] } {
    try {
      const statements = this.parse(source);

      const analyzer = new Analyzer(this.interpreter, statements);
      const { errors: analyzeErrs } = analyzer.analyze();
      if (this.reportErrors(source, analyzeErrs)) {
        return { status: AtlasStatus.STATIC_ERROR, statements: [] };
      }

      const { errors: typeErrs } = this.typechecker.typeCheck(statements);
      if (this.reportErrors(source, typeErrs)) {
        return { status: AtlasStatus.STATIC_ERROR, statements: [] };
      }

      return { status: AtlasStatus.VALID, statements };
    } catch (err) {
      if (err === AtlasStatus.STATIC_ERROR) {
        return { status: err, statements: [] };
      }
      throw err;
    }
  }

  parse(source: string): Stmt[] {
    const scanner = new Scanner(source);
    const { tokens, errors: scanErrs } = scanner.scan();
    if (this.reportErrors(source, scanErrs)) throw AtlasStatus.STATIC_ERROR;

    const parser = new Parser(tokens);
    const { statements, errors: parseErrs } = parser.parse();
    if (this.reportErrors(source, parseErrs)) throw AtlasStatus.STATIC_ERROR;

    return statements;
  }

  readModule(path: string): string {
    try {
      // relative imports are resolved relative to the importing file

      return fs.readFileSync(path, { encoding: "utf8" });
    } catch (error) {
      this.reporter.error(`Unable to open file: ${path}`);
      process.exit(66);
    }
  }

  reportErrors(source: string, errors: SourceError[]): boolean {
    let hasError = false;
    errors.forEach(({ sourceMessage, sourceRange }) => {
      if (sourceMessage.type === "error") hasError = true;
      this.reporter.rangeError(source, sourceRange, sourceMessage);
    });

    return hasError;
  }
}
