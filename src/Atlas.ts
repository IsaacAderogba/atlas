import fs from "fs";
import readline from "readline";
import { ConsoleReporter } from "./reporter/ConsoleReporter";
import { Reporter } from "./reporter/Reporter";
import { SourceRange } from "./utils/SourceRange";

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

  constructor({ reporter = new ConsoleReporter() }: Partial<AtlasProps> = {}) {
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
      this.reporter.reportErrorRange(source, error.sourceRange, error.message);
    }

    return { status: AtlasStatus.VALID, tokens };
  }
}

// cli
function main(args: string[]): void {
  if (args.length > 1) {
    console.log("Usage: atlas [script]");
    process.exit(64);
  } else if (args.length == 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

function runFile(path: string): void {
  const reporter = new ConsoleReporter();
  let source: string;

  try {
    source = fs.readFileSync(path, { encoding: "utf8" });
  } catch (error) {
    reporter.reportError(`Unable to open file: ${path}`);
    process.exit(66);
  }

  const atlas = new Atlas({ reporter });
  const status = atlas.run(source);

  switch (status) {
    case AtlasStatus.SYNTAX_ERROR:
    case AtlasStatus.STATIC_ERROR:
      return process.exit(65);
    case AtlasStatus.RUNTIME_ERROR:
      return process.exit(70);
    case AtlasStatus.SUCCESS:
      return process.exit(0);
  }
}

function runPrompt(): void {
  const atlas = new Atlas();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("> ");
  rl.prompt();
  rl.on("line", input => {
    atlas.run(input);
    rl.prompt();
  });
}

main(process.argv.slice(2));
