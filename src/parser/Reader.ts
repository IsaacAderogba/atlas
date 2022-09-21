import fs from "fs";
import path from "path";
import { NativeError, ReaderErrors } from "../errors/NativeError";
import { SourceFile } from "../errors/SourceError";
import { Stack } from "../utils/Stack";

export class Reader {
  cwd = process.cwd();
  files = new Stack<SourceFile>();

  readFile<T>(source: string, onRead: (sourceFile: SourceFile) => T): T {
    try {
      const file = path.isAbsolute(source)
        ? this.readAbsolute(source)
        : this.readRelative(source);

      if (!file) {
        throw new NativeError(ReaderErrors.invalidFilePath(source));
      }

      this.files.push(file);
      const result = onRead(file);
      this.files.pop();

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new NativeError(ReaderErrors.invalidFilePath(source, message));
    }
  }

  private readAbsolute(sourcePath: string): SourceFile | undefined {
    // const relativePath = this.files.peek()?.module || "";
    // let currentPath = path.join(relativePath, sourcePath);
    // let file: SourceFile | undefined = undefined;
    // while(!file) {
    // }
    // walk up the chain until it finds atlas_modules
    // import x from "foo"
    // src/atlas_modules/foo.ats
    // src/atlas_modules/foo/index.ats
    // jump up a directory
    // read stdlib
    /**
     * When to stop?
     * When it's beyond where the interpreter started
     * Need to capture the cwd
     */
    return undefined;
  }

  private readRelative(sourcePath: string): SourceFile | undefined {
    const relativeBase = this.files.peek()?.module || "";
    const modulePath = this.modulePath(sourcePath);
    const paths = [`${modulePath}.ats`, `${modulePath}/index.ats`];

    while (paths.length > 0) {
      const potentialPath = paths.pop()!;
      const modulePath = path.join(relativeBase, potentialPath);

      console.log("module path", modulePath);
      if (!fs.existsSync(modulePath)) continue;

      const source = fs.readFileSync(modulePath, { encoding: "utf8" });
      return { source, module: modulePath };
    }

    return undefined;
  }

  private modulePath(modulePath: string): string {
    const lastIndex = modulePath.lastIndexOf(".ats");
    return modulePath.substring(
      0,
      lastIndex === -1 ? modulePath.length : lastIndex
    );
  }
}
