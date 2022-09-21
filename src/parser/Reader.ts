import fs from "fs";
import { SourceFile } from "../errors/SourceError";

export class Reader {
  readFile(path: string): SourceFile {
    try {
      const source = fs.readFileSync(path, { encoding: "utf8" });

      return { source, module: path };
    } catch (error) {
      throw error;
    }
  }
}
