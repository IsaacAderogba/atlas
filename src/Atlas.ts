import { Reporter } from "./reporter/Reporter";

export enum AtlasStatus {
  "SYNTAX_ERROR" = "SYNTAX_ERROR",
  "STATIC_ERROR" = "STATIC_ERROR",
  "RUNTIME_ERROR" = "RUNTIME_ERROR",
  "SUCCESS" = "SUCCESS",
  "VALID" = "VALID",
}

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

    return AtlasStatus.SUCCESS;
  }

  check(source: string): { status: AtlasStatus; tokens: any[] } {
    const scanner = new Scanner(source);
    const { errors, tokens } = scanner.scanTokens();

    for (const error of errors) {
      this.reporter.reportRangeError(source, error.sourceRange, error.message);
    }

    return { status: AtlasStatus.VALID, tokens };
  }
}
