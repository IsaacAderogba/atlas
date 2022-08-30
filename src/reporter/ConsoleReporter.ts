import { SourceRange } from "../utils/SourceRange";
import { Reporter } from "./Reporter";

export class ConsoleReporter implements Reporter {
  report(message: string): void {
    console.log(message);
  }

  reportErrorRange(source: string, range: SourceRange, message: string): void {
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

    this.reportError(report);
  }

  reportError(message: string): void {
    console.error(message);
  }
}
