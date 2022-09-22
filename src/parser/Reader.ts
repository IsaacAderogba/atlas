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
    onResult: (result: {
      statements: Stmt[];
      errors: SyntaxError[];
      file: SourceFile;
    }) => T
  ): T {
    let file: SourceFile | undefined;

    try {
      file =
        source[0] !== "."
          ? this.readAbsolute(source)
          : this.readRelative(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new NativeError(NativeErrors.invalidFilePath(source, message));
    }

    if (!file) throw new NativeError(NativeErrors.invalidFilePath(source));

    this.files.push(file);
    const result = onResult({ ...this.parse(file), file });
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
    const callerDir = this.getCallerDir();

    const modulePath = this.modulePath(sourcePath);
    let start = path.join(this.cwd, callerDir);
    const end = path.dirname(this.cwd);

    while (start !== end) {
      const paths = [
        path.join(start, "atlas_modules", `${modulePath}.ats`),
        path.join(start, "atlas_modules", modulePath, "index.ats"),
      ];

      for (const potentialPath of paths) {
        if (!fs.existsSync(potentialPath)) continue;
        
        const source = fs.readFileSync(potentialPath, { encoding: "utf8" });
        return { source, module: potentialPath };
      }

      start = path.dirname(start);
    }

    return this.readStdlib(sourcePath);
  }

  private readStdlib(dirPath: string): SourceFile | undefined {
    const libModule = path.join(
      __dirname,
      "../",
      "stdlib",
      dirPath,
      "index.ats"
    );

    if (fs.existsSync(libModule)) {
      const source = fs.readFileSync(libModule, { encoding: "utf8" });
      return { source, module: libModule };
    }

    return undefined;
  }

  private readRelative(sourcePath: string): SourceFile | undefined {
    const callerDir = this.getCallerDir();
    const modulePath = this.modulePath(sourcePath);
    const paths = [`${modulePath}.ats`, path.join(modulePath, "index.ats")];

    for (const potentialPath of paths) {
      const modulePath = path.join(callerDir, potentialPath);

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
