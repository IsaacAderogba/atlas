import fs from "fs";
import { NativeError, ReaderErrors } from "../errors/NativeError";
import { SourceFile } from "../errors/SourceError";
import { Stack } from "../utils/Stack";

export class Reader {
  files = new Stack<SourceFile>();

  /**
   * When reading, use the last file as the context
   */

  readFile<T>(path: string, onRead: (sourceFile: SourceFile) => T): T {
    try {
      const source = fs.readFileSync(path, { encoding: "utf8" });

      const file: SourceFile = { source, module: path };
      this.files.push(file);
      const result = onRead(file);
      this.files.pop();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new NativeError(ReaderErrors.invalidFilePath(path, message));
    }
  }
}
