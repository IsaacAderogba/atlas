import fs from "fs";
import readline from "readline";
import { ConsolePrinter } from "./printer/ConsolePrinter";
import { Printer } from "./printer/Printer";
import { SourceRange } from "./utils/SourceRange";

export class Atlas {
  private static readonly printer: Printer = new ConsolePrinter();

  public static main(args: string[]): void {
    if (args.length > 1) {
      console.log("Usage: atlas [script]");
      process.exit(64);
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(path: string): void {
    const str = fs.readFileSync(path, { encoding: "utf-8" });
    this.run(str);
  }

  private static runPrompt(): void {
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

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    console.log(tokens);
  }

  static error(source: string, range: SourceRange, message: string): void {
    const indent = 6;

    const { start } = range;
    const sourceLine = source.split("\n")[start.line - 1].replace(/\t/g, " ");

    const underline =
      Array(indent + start.column - 1)
        .fill(" ")
        .join("") + Array(range.length()).fill("^").join("");

    const report =
      `${start.line}:${start.column} - error: ${message}\n\n` +
      `${start.line.toString().padEnd(indent)}${sourceLine}\n` +
      underline;

    this.printer.printError(report);
  }
}

Atlas.main(process.argv.slice(2));
