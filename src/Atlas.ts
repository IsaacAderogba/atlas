import { Stmt } from "./ast/Stmt";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Reporter } from "./reporter/Reporter";
import { Interpreter } from "./runtime/Interpreter";
import { AtlasStatus } from "./utils/AtlasStatus";

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

    if (scanErrs.length) {
      scanErrs.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return { status: AtlasStatus.SYNTAX_ERROR, statements: [] };
    }

    const parser = new Parser(tokens);
    const { statements, errors: parseErrs } = parser.parse();

    if (parseErrs.length) {
      parseErrs.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return { status: AtlasStatus.SYNTAX_ERROR, statements: [] };
    }

    return { status: AtlasStatus.VALID, statements };
  }
}
