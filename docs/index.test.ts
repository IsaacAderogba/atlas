import fs from "fs";
import { Atlas } from "../src/Atlas";
import { Reporter } from "../src/reporter/Reporter";
import { SourceMessage, SourceRange } from "../src/errors/SourceError";

class TestReporter implements Reporter {
  stdout = "";
  stderr = "";

  log(message: string): void {
    this.stdout += message + "\n";
  }

  rangeError(_range: SourceRange, { title }: SourceMessage): void {
    this.stderr += title + "\n";
  }

  error(message: string): void {
    this.stderr += message + "\n";
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
      if (line.startsWith("-- OUTPUT --")) target = "stdout";
      else if (line.startsWith("-- ERROR --")) target = "stderr";
      else spec[target] += (spec[target] ? "\n" : "") + line;
    }

    const testReporter = new TestReporter();
    const atlas = new Atlas(testReporter);

    atlas.runFile(spec.source);
    expect(testReporter.stderr).toBe(spec.stderr);
    expect(testReporter.stdout).toBe(spec.stdout);
  });
}
