import fs from "fs";
import readline from "readline";
import { Atlas } from "./Atlas";
import { ConsoleReporter } from "./reporter/ConsoleReporter";
import { AtlasStatus } from "./utils/AtlasStatus";

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
    reporter.error(`Unable to open file: ${path}`);
    process.exit(66);
  }

  const atlas = new Atlas({ reporter });
  const status = atlas.run(source);

  switch (status) {
    case AtlasStatus.STATIC_ERROR:
      return process.exit(65);
    case AtlasStatus.RUNTIME_ERROR:
      return process.exit(70);
    case AtlasStatus.SUCCESS:
      return process.exit(0);
  }
}

function runPrompt(): void {
  const atlas = new Atlas({ reporter: new ConsoleReporter() });

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
