import readline from "readline";
import { Stmt } from "./ast/Stmt";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Interpreter } from "./runtime/Interpreter";
import { AtlasStatus } from "./utils/AtlasStatus";
import { Analyzer } from "./analyzer/Analyzer";
import { SourceError, SourceFile } from "./errors/SourceError";
import { ConsoleReporter } from "./reporter/ConsoleReporter";
import { TypeChecker } from "./typechecker/TypeChecker";
import { Reader } from "./parser/Reader";
import { NativeError } from "./errors/NativeError";
import { AtlasAPI } from "./AtlasAPI";

export class Atlas implements AtlasAPI {
  reporter = new ConsoleReporter();
  reader = new Reader();
  interpreter = new Interpreter(this.reader);
  typechecker = new TypeChecker(this.reader);

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
    try {
      this.reader.readFile(path, sourceFile => {
        const status = this.run(sourceFile);

        switch (status) {
          case AtlasStatus.STATIC_ERROR:
            return process.exit(65);
          case AtlasStatus.RUNTIME_ERROR:
            return process.exit(70);
          case AtlasStatus.SUCCESS:
          case AtlasStatus.VALID:
            return process.exit(0);
        }
      });
    } catch (err) {
      if (err instanceof NativeError) {
        this.reporter.error(
          `${err.sourceMessage.title}: ${err.sourceMessage.body}`
        );
      }
      process.exit(66);
    }
  }

  runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("> ");
    rl.prompt();
    rl.on("line", source => {
      this.run({ source, module: "repl" });
      rl.prompt();
    });
  }

  run(file: SourceFile): AtlasStatus {
    const { status, statements } = this.check(file);
    if (status !== AtlasStatus.VALID) return status;

    const { errors } = this.interpreter.interpret(statements);

    if (errors.length) {
      errors.forEach(e =>
        this.reporter.rangeError(e.sourceRange, e.sourceMessage)
      );
      return AtlasStatus.RUNTIME_ERROR;
    }

    return AtlasStatus.SUCCESS;
  }

  check(file: SourceFile): { status: AtlasStatus; statements: Stmt[] } {
    try {
      const statements = this.parse(file);

      const analyzer = new Analyzer(this.reader, this.interpreter, statements);
      const { errors: analyzeErrs } = analyzer.analyze();
      if (this.reportErrors(analyzeErrs)) {
        return { status: AtlasStatus.STATIC_ERROR, statements: [] };
      }

      const { errors: typeErrs } = this.typechecker.typeCheck(statements);
      if (this.reportErrors(typeErrs)) {
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

  parse(file: SourceFile): Stmt[] {
    const scanner = new Scanner();
    const { tokens, errors: scanErrs } = scanner.scan(file);
    if (this.reportErrors(scanErrs)) throw AtlasStatus.STATIC_ERROR;

    const parser = new Parser(tokens);
    const { statements, errors: parseErrs } = parser.parse();
    if (this.reportErrors(parseErrs)) throw AtlasStatus.STATIC_ERROR;

    return statements;
  }

  private reportErrors(errors: SourceError[]): boolean {
    let hasError = false;
    errors.forEach(({ sourceMessage, sourceRange }) => {
      if (sourceMessage.type === "error") hasError = true;
      this.reporter.rangeError(sourceRange, sourceMessage);
    });

    return hasError;
  }
}
