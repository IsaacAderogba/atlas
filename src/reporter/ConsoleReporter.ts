import chalk from "chalk";
import { SourceMessage, SourceRange } from "../utils/Source";
import { Reporter } from "./Reporter";

export class ConsoleReporter implements Reporter {
  log(message: string): void {
    console.log(message);
  }

  rangeError(
    source: string,
    range: SourceRange,
    { title, body }: SourceMessage
  ): void {
    const indent = 6;

    const { start } = range;
    const sourceLine = source.split("\n")[start.line - 1].replace(/\t/g, " ");

    const underline =
      Array(indent + start.column - 1)
        .fill(" ")
        .join("") + Array(range.length()).fill("^").join("");

    const lineColumn = chalk.red(`${start.line}:${start.column} | `);
    const startLine = `${start.line.toString().padEnd(indent)}`;
    const errMessage = chalk.red(title);

    const report =
      `\n${lineColumn}${errMessage}\n\n` +
      `${startLine}${sourceLine}\n` +
      chalk.blue(`${underline} ${body}`);

    this.error(report);
  }

  error(message: string): void {
    console.error(message);
  }
}
