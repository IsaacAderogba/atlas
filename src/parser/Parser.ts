import {
  BinaryExpr,
  TernaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ErrorExpr,
} from "../ast/Expr";
import { ExpressionStmt, PrintStmt, Stmt } from "../ast/Stmt";
import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { Errors } from "../utils/Errors";
import { SourceRangeable } from "../utils/SourceRange";
import { SyntaxError } from "./SyntaxError";

export class Parser {
  private tokens: Token[];
  private errors: SyntaxError[] = [];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): { statements: Stmt[]; errors: SyntaxError[] } {
    try {
      this.errors = [];
      const statements: Stmt[] = [];

      while (!this.isAtEnd()) {
        statements.push(this.statement());
      }

      return { statements, errors: this.errors };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { statements: [], errors: this.errors };
      }
      throw error;
    }
  }

  private statement(): Stmt {
    if (this.match("PRINT")) return this.printStatement();

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume("SEMICOLON", Errors.ExpectedSemiColon);
    return new PrintStmt(value);
  }

  private expressionStatement(): Stmt {
    const value = this.expression();
    this.consume("SEMICOLON", Errors.ExpectedSemiColon);
    return new ExpressionStmt(value);
  }

  public expression(): Expr {
    return this.ternary();
  }

  private ternary(): Expr {
    let expr = this.equality();

    if (this.match("QUESTION")) {
      const thenBranch = this.ternary();
      this.consume("COLON", Errors.ExpectedColon);
      const elseBranch = this.ternary();
      expr = new TernaryExpr(expr, thenBranch, elseBranch);
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const operator = this.previous();
      const right = this.comparison();

      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match("MINUS", "PLUS")) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match("SLASH", "STAR")) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match("BANG", "MINUS")) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match("NUMBER", "STRING", "FALSE", "TRUE", "NULL")) {
      const token = this.previous();
      return new LiteralExpr(token.literal!, token);
    }

    if (this.match("LEFT_PAREN")) {
      const expr = this.expression();
      this.consume("RIGHT_PAREN", Errors.ExpectedRightParen);
      return new GroupingExpr(expr);
    }

    if (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(this.previous(), this.equality());
    }

    if (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(this.previous(), this.comparison());
    }

    if (this.match("PLUS")) {
      this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(this.previous(), this.term());
    }

    if (this.match("SLASH", "STAR")) {
      this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(this.previous(), this.factor());
    }

    throw this.error(this.peek(), Errors.ExpectedExpression);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();    
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  // @ts-ignore
  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") return;

      switch (this.peek().type) {
        case "CLASS":
        case "FUN":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "PRINT":
        case "RETURN":
          return;
      }

      this.advance();
    }
  }

  private error(source: SourceRangeable, message: string): SyntaxError {
    const error = new SyntaxError(message, source.sourceRange());
    this.errors.push(error);
    return error;
  }
}
