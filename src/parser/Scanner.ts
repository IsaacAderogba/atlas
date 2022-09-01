import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { isAlpha, isAlphaNumeric, isDigit } from "../utils/alphanumeric";
import { AtlasValue } from "../runtime/AtlasValue";
import { Errors } from "../utils/Errors";
import { SourceRange } from "../utils/SourceRange";
import { Keywords } from "./Keywords";
import { SyntaxError } from "./SyntaxError";
import { AtlasString } from "../runtime/AtlasString";
import { AtlasNumber } from "../runtime/AtlasNumber";
import { AtlasNull } from "../runtime/AtlasNull";
import { AtlasTrue } from "../runtime/AtlasTrue";
import { AtlasFalse } from "../runtime/AtlasFalse";

export class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private lineStart = 0;

  private errors: SyntaxError[] = [];

  constructor(source: string) {
    this.source = source;
  }

  scan(): { tokens: Token[]; errors: SyntaxError[] } {
    try {
      this.errors = [];

      while (!this.isAtEnd()) {
        this.start = this.current;
        this.scanToken();
      }
      this.start = this.current;
      this.addToken("EOF", { text: "\0" });

      return { tokens: this.tokens, errors: this.errors };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { tokens: [], errors: this.errors };
      }
      throw error;
    }
  }

  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      case "(":
        this.addToken("LEFT_PAREN");
        break;
      case ")":
        this.addToken("RIGHT_PAREN");
        break;
      case "{":
        this.addToken("LEFT_BRACE");
        break;
      case "}":
        this.addToken("RIGHT_BRACE");
        break;
      case ",":
        this.addToken("COMMA");
        break;
      case ".":
        this.addToken("DOT");
        break;
      case "-":
        this.addToken("MINUS");
        break;
      case "+":
        this.addToken("PLUS");
        break;
      case ";":
        this.addToken("SEMICOLON");
        break;
      case "*":
        this.addToken("STAR");
        break;
      case "?":
        this.addToken("QUESTION");
        break;
      case ":":
        this.addToken("COLON");
        break;
      case "!":
        this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG");
        break;
      case "=":
        this.addToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL");
        break;
      case "<":
        this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS");
        break;
      case ">":
        this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
        break;
      case "/":
        if (this.match("/")) {
          this.lineComment();
        } else if (this.match("*")) {
          this.blockComment();
        } else {
          this.addToken("SLASH");
        }
        break;
      case " ":
      case "\r":
      case "\t":
      case "\n":
        break;
      case '"':
      case "'":
        this.string(char);
        break;
      default:
        if (isDigit(char)) {
          this.number();
        } else if (isAlpha(char)) {
          this.primitives();
        } else {
          this.error(Errors.UnexpectedCharacter);
        }
    }
  }

  private blockComment(): void {
    while (!this.isAtEnd()) {
      if (this.match("*") && this.match("/")) break;
      this.advance();
    }
  }

  private lineComment(): void {
    while (this.peek() !== "\n" && !this.isAtEnd()) {
      this.advance();
    }
  }

  private primitives(): void {
    while (isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    switch (text) {
      case "null":
        this.addToken("NULL", { literal: new AtlasNull() });
        break;
      case "true":
        this.addToken("TRUE", { literal: new AtlasTrue() });
        break;
      case "false":
        this.addToken("FALSE", { literal: new AtlasFalse() });
        break;
      default:
        this.addToken(Keywords.get(text) || "IDENTIFIER");
    }
  }

  private string(char: '"' | "'"): void {
    while (this.peek() !== char && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) return this.error(Errors.UnterminatedString);

    // The closing " | '.
    this.advance();

    // Trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken("STRING", { literal: new AtlasString(value) });
  }

  private number(): void {
    while (isDigit(this.peek())) this.advance();

    // Look for a fractional part
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (isDigit(this.peek())) this.advance();
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken("NUMBER", { literal: new AtlasNumber(value) });
  }

  private match(expected: string): boolean {
    if (this.peek() !== expected) return false;
    this.advance();

    return true;
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private advance(): string {
    const char = this.source.charAt(this.current);
    this.current += 1;

    if (char === "\n") {
      this.line += 1;
      this.lineStart = this.current;
    }

    return char;
  }

  private addToken(
    type: TokenType,
    {
      literal,
      text = this.source.substring(this.start, this.current),
    }: Partial<{ literal: AtlasValue; text: string }> = {}
  ): void {
    const column = 1 + this.start - this.lineStart;
    this.tokens.push(new Token(type, text, literal, this.line, column));
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private error(message: string): void {
    const line = this.line;
    const column = this.current - this.lineStart;
    const sourceRange = new SourceRange(
      { line, column },
      { line, column: column + 1 }
    );
    this.errors.push(new SyntaxError(message, sourceRange));
  }
}
