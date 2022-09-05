import chalk from "chalk";
import { SourceMessage, SourceRange } from "../errors/SourceError";
import { Reporter } from "./Reporter";

export class ConsoleReporter implements Reporter {
  log(message: string): void {
    console.log(message);
  }

  rangeError(
    source: string,
    range: SourceRange,
    { title, body, type }: SourceMessage
  ): void {
    const indent = 6;
    const errorChalk = type === "error" ? chalk.red : chalk.yellow;

    const { start } = range;
    const sourceLine = source.split("\n")[start.line - 1].replace(/\t/g, " ");

    const underline =
      Array(indent + start.column - 1)
        .fill(" ")
        .join("") + Array(range.length()).fill("^").join("");

    const lineColumn = errorChalk(`${start.line}:${start.column} | `);
    const startLine = `${start.line.toString().padEnd(indent)}`;


    const report =
      `${lineColumn}${errorChalk(title)}\n\n` +
      `${startLine}${sourceLine}\n` +
      chalk.blue(`${underline} ${body}\n`);

    this.error(report);
  }

  error(message: string): void {
    console.error(message);
  }
}
