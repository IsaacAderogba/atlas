import fs from "fs";
import { test, expect } from "vitest";
import { Atlas } from "../src/Atlas";
import { TestReporter, findFilesRecursively } from "./TestReporter";

export const runTests = (testsDirPath: string, ext: string): void => {
  for (const fileName of findFilesRecursively(testsDirPath, ext)) {
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
};
