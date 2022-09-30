import fs from "fs";
import { test, expect } from "vitest";
import { Atlas } from "../src/Atlas";
import { Reporter } from "../src/reporter/Reporter";
import { SourceMessage, SourceRange } from "../src/errors/SourceError";

class TestReporter implements Reporter {
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

function findFilesRecursively(dirPath: string, suffix: string): string[] {
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

const testsDirPath = __dirname;
for (const fileName of findFilesRecursively(testsDirPath, ".ats")) {
  test(fileName, () => {
    const filePath = `${testsDirPath}/${fileName}`;
    const content = fs.readFileSync(filePath, { encoding: "utf8" });

    const spec = {
      source: "",
      stdout: "",
      stderr: "",
    };
    let target: keyof typeof spec = "source";

    for (const line of content.split("\n")) {
      if (line.startsWith("-- stdout --")) {
        target = "stdout";
      } else if (line.startsWith("-- stderr --")) {
        target = "stderr";
      } else {
        spec[target] += (spec[target] ? "\n" : "") + line;
      }
    }

    const testReporter = new TestReporter();
    const atlas = new Atlas(testReporter);

    atlas.runSource({ module: filePath, source: spec.source });

    expect(testReporter.stderr).toBe(spec.stderr);
    expect(testReporter.stdout).toBe(spec.stdout);
  });
}
