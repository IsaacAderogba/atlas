import fs from "fs";
import path from "path";
import { Stmt } from "../ast/Stmt";
import { NativeError, NativeErrors } from "../errors/NativeError";
import { SourceError, SourceFile } from "../errors/SourceError";
import { SyntaxError } from "../errors/SyntaxError";
import { Stack } from "../utils/Stack";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";

export class Reader {
  private cwd = process.cwd();
  private files = new Stack<SourceFile>();

  readFile<T>(
    source: string,
    onResult: (result: { statements: Stmt[]; errors: SyntaxError[] }) => T
  ): T {
    let file: SourceFile | undefined;

    try {
      file = path.isAbsolute(source)
        ? this.readAbsolute(source)
        : this.readRelative(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new NativeError(NativeErrors.invalidFilePath(source, message));
    }

    if (!file) throw new NativeError(NativeErrors.invalidFilePath(source));

    this.files.push(file);
    const result = onResult(this.parse(file));
    this.files.pop();

    return result;
  }

  parse(file: SourceFile): {
    errors: SyntaxError[];
    statements: Stmt[];
  } {
    const scanner = new Scanner();
    const { tokens, errors: scanErrs } = scanner.scan(file);
    if (this.hadError(scanErrs)) return { errors: scanErrs, statements: [] };

    const parser = new Parser(tokens);
    const { statements, errors: parseErrs } = parser.parse();
    if (this.hadError(parseErrs)) return { errors: parseErrs, statements: [] };

    return { statements, errors: [] };
  }

  hadError(errors: SourceError[]): boolean {
    return errors.some(error => error.sourceMessage.type === "error");
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
    const callerDir = this.getCallerDir();
    const modulePath = this.modulePath(sourcePath);
    const paths = [`${modulePath}.ats`, `${modulePath}/index.ats`];

    while (paths.length > 0) {
      const potentialPath = paths.pop()!;
      const modulePath = path.join(callerDir, potentialPath);

      console.log("module path", modulePath);
      if (!fs.existsSync(modulePath)) continue;

      const source = fs.readFileSync(modulePath, { encoding: "utf8" });
      return { source, module: modulePath };
    }

    return undefined;
  }

  private getCallerDir(): string {
    return path.dirname(this.files.peek()?.module || "");
  }

  private modulePath(modulePath: string): string {
    const lastIndex = modulePath.lastIndexOf(".ats");
    return modulePath.substring(
      0,
      lastIndex === -1 ? modulePath.length : lastIndex
    );
  }
}
