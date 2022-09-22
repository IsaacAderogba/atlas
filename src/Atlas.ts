import readline from "readline";
import { Stmt } from "./ast/Stmt";
import { Interpreter } from "./runtime/Interpreter";
import { AtlasStatus } from "./utils/AtlasStatus";
import { Analyzer } from "./analyzer/Analyzer";
import { SourceError } from "./errors/SourceError";
import { ConsoleReporter } from "./reporter/ConsoleReporter";
import { TypeChecker } from "./typechecker/TypeChecker";
import { Reader } from "./parser/Reader";
import { AtlasAPI } from "./AtlasAPI";
import { isNativeError } from "./errors/NativeError";

export class Atlas implements AtlasAPI {
  reporter = new ConsoleReporter();
  reader = new Reader();
  interpreter = new Interpreter(this);
  typechecker = new TypeChecker(this);

  main(args: string[]): void {
    try {
      if (args.length > 1) {
        console.log("Usage: atlas [script]");
        process.exit(64);
      } else if (args.length == 1) {
        this.runFile(args[0]);
      } else {
        this.runPrompt();
      }
    } catch (err) {
      if (isNativeError(err)) this.reporter.error(err.message);
      process.exit(66);
    }
  }

  runFile(path: string): void {
    this.reader.readFile(path, ({ statements, errors }) => {
      if (this.reportErrors(errors)) process.exit(65);

      const status = this.run(statements);
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
  }

  runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("> ");
    rl.prompt();
    rl.on("line", source => {
      const { statements, errors } = this.reader.parse({
        source,
        module: "repl",
      });

      if (!this.reportErrors(errors)) this.run(statements);
      rl.prompt();
    });
  }

  run(statements: Stmt[]): AtlasStatus {
    const status = this.check(statements);
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

  check(statements: Stmt[]): AtlasStatus {
    const analyzer = new Analyzer(this, statements);
    const { errors: analyzeErrs } = analyzer.analyze();
    if (this.reportErrors(analyzeErrs)) return AtlasStatus.STATIC_ERROR;

    const { errors: typeErrs } = this.typechecker.typeCheck(statements);
    if (this.reportErrors(typeErrs)) return AtlasStatus.STATIC_ERROR;

    return AtlasStatus.VALID;
  }

  reportErrors(errors: SourceError[]): boolean {
    let hasError = false;
    errors.forEach(({ sourceMessage, sourceRange }) => {
      if (sourceMessage.type === "error") hasError = true;
      this.reporter.rangeError(sourceRange, sourceMessage);
    });

    return hasError;
  }
}
