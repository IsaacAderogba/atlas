import { Scanner } from "./parser/Scanner";
import { Reporter } from "./reporter/Reporter";
import { AtlasStatus } from "./utils/AtlasStatus";

interface AtlasProps {
  reporter: Reporter;
}

export class Atlas {
  private readonly reporter: Reporter;

  constructor({ reporter }: AtlasProps) {
    this.reporter = reporter;
  }

  run(source: string): AtlasStatus {
    const { status, tokens } = this.check(source);

    if (status !== AtlasStatus.VALID) return status;

    console.log("tokens", tokens);
    return AtlasStatus.SUCCESS;
  }

  check(source: string): { status: AtlasStatus; tokens: any[] } {
    const scanner = new Scanner(source);
    const { tokens, errors } = scanner.scanTokens();

    if (errors.length) {
      errors.forEach(e => this.reporter.rangeError(source, e.sourceRange, e.message));
      return { status: AtlasStatus.SYNTAX_ERROR, tokens: [] };
    }

    return { status: AtlasStatus.VALID, tokens };
  }
}
