import { Stmt } from "./ast/Stmt";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Reporter } from "./reporter/Reporter";
import { Interpreter } from "./interpreter/Interpreter";
import { AtlasStatus } from "./utils/AtlasStatus";
import { Analyzer } from "./analyzer/Analyzer";
import { SourceError } from "./errors/SourceError";

interface AtlasProps {
  reporter: Reporter;
}

export class Atlas {
  private reporter: Reporter;
  private interpreter = new Interpreter();

  constructor({ reporter }: AtlasProps) {
    this.reporter = reporter;
  }

  run(source: string): AtlasStatus {
    const { status, statements } = this.check(source);
    if (status !== AtlasStatus.VALID) return status;

    const { errors } = this.interpreter.interpret(statements);

    if (errors.length) {
      errors.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return AtlasStatus.RUNTIME_ERROR;
    }

    return AtlasStatus.SUCCESS;
  }

  check(source: string): { status: AtlasStatus; statements: Stmt[] } {
    const scanner = new Scanner(source);
    const { tokens, errors: scanErrs } = scanner.scan();
    if (this.reportErrors(source, scanErrs)) {
      return { status: AtlasStatus.STATIC_ERROR, statements: [] };
    }

    const parser = new Parser(tokens);
    const { statements, errors: parseErrs } = parser.parse();
    if (this.reportErrors(source, parseErrs)) {
      return { status: AtlasStatus.STATIC_ERROR, statements: [] };
    }

    const analyzer = new Analyzer(this.interpreter, statements);
    const { errors: analyzeErrs } = analyzer.analyze();
    if (this.reportErrors(source, analyzeErrs)) {
      return { status: AtlasStatus.STATIC_ERROR, statements: [] };
    }

    return { status: AtlasStatus.VALID, statements };
  }

  private reportErrors(source: string, errors: SourceError[]): boolean {
    let hasError = false;
    errors.forEach(({ message, sourceRange }) => {
      if (message.type === "error") hasError = true;
      this.reporter.rangeError(source, sourceRange, message);
    });

    return hasError;
  }
}
