import { AtlasValue } from "../primitives/AtlasValue";
import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { TokenType } from "./TokenType";

export class Token implements SourceRangeable {
  constructor(
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

    return new SourceRange(start, end);
  }

  clone({
    type = this.type,
    lexeme = this.lexeme,
    literal = this.literal,
    line = this.line,
    column = this.column,
  }: Partial<Token> = {}): Token {
    return new Token(type, lexeme, literal, line, column);
  }
}
