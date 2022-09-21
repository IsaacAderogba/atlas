import { AtlasValue } from "../primitives/AtlasValue";
import {
  SourceFile,
  SourceRange,
  SourceRangeable,
} from "../errors/SourceError";
import { TokenType } from "./TokenType";

export class Token implements SourceRangeable {
  constructor(
    readonly file: SourceFile,
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: AtlasValue | undefined,
    readonly line: number,
    readonly column: number
  ) {}

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }

  sourceRange(): SourceRange {
    const start = { line: this.line, column: this.column };
    const end = { line: this.line, column: this.column + this.lexeme.length };

    return new SourceRange(this.file, start, end);
  }

  clone({
    file = this.file,
    type = this.type,
    lexeme = this.lexeme,
    literal = this.literal,
    line = this.line,
    column = this.column,
  }: Partial<Token> = {}): Token {
    return new Token(file, type, lexeme, literal, line, column);
  }
}
