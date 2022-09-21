import fs from "fs";
import { NativeError, ReaderErrors } from "../errors/NativeError";
import { SourceFile } from "../errors/SourceError";

export class Reader {
  readFile(path: string): SourceFile {
    try {
      const source = fs.readFileSync(path, { encoding: "utf8" });

      return { source, module: path };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new NativeError(ReaderErrors.invalidFilePath(path, message));
    }
  }
}
