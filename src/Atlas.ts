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
    const { status, expression } = this.check(source);
    if (status !== AtlasStatus.VALID) return status;

    const { value, errors } = this.interpreter.interpret(expression);

    if (errors.length) {
      errors.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return AtlasStatus.RUNTIME_ERROR;
    }

    console.log("output", value);

    return AtlasStatus.SUCCESS;
  }

  check(source: string): { status: AtlasStatus; expression?: any } {
    const scanner = new Scanner(source);
    const { tokens, errors: scanErrs } = scanner.scan();

    if (scanErrs.length) {
      scanErrs.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return { status: AtlasStatus.SYNTAX_ERROR };
    }

    const parser = new Parser(tokens);
    const { expression, errors: parseErrs } = parser.parse();

    if (parseErrs.length) {
      parseErrs.forEach(e =>
        this.reporter.rangeError(source, e.sourceRange, e.message)
      );
      return { status: AtlasStatus.SYNTAX_ERROR };
    }

    return { status: AtlasStatus.VALID, expression };
  }
}
