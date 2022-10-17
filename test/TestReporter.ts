import fs from "fs";
import { SourceMessage, SourceRange } from "../src/errors/SourceError";
import { Reporter } from "../src/reporter/Reporter";

export class TestReporter implements Reporter {
  stdout = "";
  stderr = "";

  log(message: string): void {
    this.stdout += (this.stdout ? "\n" : "") + message;
  }

  rangeError(_range: SourceRange, { title }: SourceMessage): void {
    this.stderr += (this.stderr ? "\n" : "") + title;
  }

  error(message: string): void {
    this.stderr += (this.stderr ? "\n" : "") + message;
  }
}

export function findFilesRecursively(dirPath: string, suffix: string): string[] {
  const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });
  return dirEntries.flatMap(dirEntry => {
    if (dirEntry.isFile() && dirEntry.name.endsWith(suffix)) {
      return [dirEntry.name];
    } else if (dirEntry.isDirectory()) {
      return findFilesRecursively(`${dirPath}/${dirEntry.name}`, suffix).map(
        fileName => `${dirEntry.name}/${fileName}`
      );
    }
    return [];
  });
}