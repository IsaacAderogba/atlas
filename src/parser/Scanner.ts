import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { isAlpha, isAlphaNumeric, isDigit } from "../utils/alphanumeric";
import { AtlasValue } from "../primitives/AtlasValue";
import { SourceFile, SourceMessage, SourceRange } from "../errors/SourceError";
import { Keywords } from "../ast/Keywords";
import { SyntaxError, SyntaxErrors } from "../errors/SyntaxError";
import { atlasString } from "../primitives/AtlasString";
import { atlasNumber } from "../primitives/AtlasNumber";
import { atlasNull } from "../primitives/AtlasNull";
import { atlasBoolean } from "../primitives/AtlasBoolean";

export class Scanner {
  private file!: SourceFile;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private lineStart = 0;

  private errors: SyntaxError[] = [];

  scan(file: SourceFile): { tokens: Token[]; errors: SyntaxError[] } {
    try {
      this.file = file;
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
      case "[":
        this.addToken("LEFT_BRACKET");
        break;
      case "]":
        this.addToken("RIGHT_BRACKET");
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
      case "#":
        this.addToken("HASH");
        break;
      case "|":
        this.addToken(this.match("|") ? "PIPE_PIPE" : "PIPE");
        break;
      case "&":
        this.addToken(this.match("&") ? "AMPERSAND_AMPERSAND" : "AMPERSAND");
        break;
      case ":":
        this.addToken(this.match("=") ? "COLON_EQUAL" : "COLON");
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
          this.error(SyntaxErrors.unsupportedCharacter());
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

    const text = this.file.source.substring(this.start, this.current);
    switch (text) {
      case "null":
        this.addToken("NULL", { literal: atlasNull });
        break;
      case "true":
        this.addToken("TRUE", { literal: atlasBoolean(true) });
        break;
      case "false":
        this.addToken("FALSE", { literal: atlasBoolean(false) });
        break;
      default:
        this.addToken(Keywords.get(text) || "IDENTIFIER");
    }
  }

  private string(char: '"' | "'"): void {
    while (this.peek() !== char && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return this.error(SyntaxErrors.unterminatedString());
    }

    // The closing " | '.
    this.advance();

    // Trim the surrounding quotes
    const value = this.file.source.substring(this.start + 1, this.current - 1);
    this.addToken("STRING", { literal: atlasString(value) });
  }

  private number(): void {
    while (isDigit(this.peek())) this.advance();

    // Look for a fractional part
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (isDigit(this.peek())) this.advance();
    }

    const value = parseFloat(
      this.file.source.substring(this.start, this.current)
    );
    this.addToken("NUMBER", { literal: atlasNumber(value) });
  }

  private match(expected: string): boolean {
    if (this.peek() !== expected) return false;
    this.advance();

    return true;
  }

  private peekNext(): string {
    if (this.current + 1 >= this.file.source.length) return "\0";
    return this.file.source.charAt(this.current + 1);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.file.source.charAt(this.current);
  }

  private advance(): string {
    const char = this.file.source.charAt(this.current);
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
      text = this.file.source.substring(this.start, this.current),
    }: Partial<{ literal: AtlasValue; text: string }> = {}
  ): void {
    const column = 1 + this.start - this.lineStart;
    this.tokens.push(
      new Token(this.file, type, text, literal, this.line, column)
    );
  }

  private isAtEnd(): boolean {
    return this.current >= this.file.source.length;
  }

  private error(message: SourceMessage): void {
    const line = this.line;
    const column = this.current - this.lineStart;
    const sourceRange = new SourceRange(
      this.file,
      { line, column },
      { line, column: column + 1 }
    );
    this.errors.push(new SyntaxError(message, sourceRange));
  }
}
