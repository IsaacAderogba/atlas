import { SourceRange } from "../utils/SourceRange";
import { Reporter } from "./Reporter";

export class ConsoleReporter implements Reporter {
  log(message: string): void {
    console.log(message);
  }

  rangeError(source: string, range: SourceRange, message: string): void {
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

    this.error(report);
  }

  error(message: string): void {
    console.error(message);
  }
}
