import {
  BinaryExpr,
  TernaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ErrorExpr,
  VariableExpr,
} from "../ast/Expr";
import {
  ErrorStmt,
  ExpressionStmt,
  PrintStmt,
  Stmt,
  VarStmt,
} from "../ast/Stmt";
import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { Errors } from "../utils/Errors";
import { SyntaxError } from "./SyntaxError";

export class Parser {
  private tokens: Token[];
  private errors: SyntaxError[] = [];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): { statements: Stmt[]; errors: SyntaxError[] } {
    this.errors = [];
    const statements: Stmt[] = [];

    try {
      while (!this.isAtEnd()) {
        statements.push(this.declaration());
      }

      return { statements, errors: this.errors };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { statements, errors: this.errors };
      }
      throw error;
    }
  }

  private declaration(): Stmt {
    try {
      if (this.match("VAR")) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return this.errorStatement(error);
      }
      throw error;
    }
  }

  private varDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", Errors.ExpectedIdentifier);
    const initializer = this.match("EQUAL") ? this.expression() : undefined;
    this.consume("SEMICOLON", Errors.ExpectedSemiColon);

    return new VarStmt(name, initializer);
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

    if (this.match("IDENTIFIER")) {
      return new VariableExpr(this.previous());
    }

    if (this.match("LEFT_PAREN")) {
      const expr = this.expression();
      this.consume("RIGHT_PAREN", Errors.ExpectedRightParen);
      return new GroupingExpr(expr);
    }

    if (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const err = this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(err, this.previous(), this.equality());
    }

    if (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const err = this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(err, this.previous(), this.comparison());
    }

    if (this.match("PLUS")) {
      const err = this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(err, this.previous(), this.term());
    }

    if (this.match("SLASH", "STAR")) {
      const err = this.error(this.previous(), Errors.ExpectedLeftOperand);
      return new ErrorExpr(err, this.previous(), this.factor());
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
    throw this.error(this.previous() || this.peek(), message);
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

  private errorStatement(err: SyntaxError): Stmt {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") return new ErrorStmt(err);

      switch (this.peek().type) {
        case "CLASS":
        case "FUN":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "PRINT":
        case "RETURN":
          return new ErrorStmt(err);
      }

      this.advance();
    }

    return new ErrorStmt(err);
  }

  private error(token: Token, message: string): SyntaxError {
    const error = new SyntaxError(message, token.sourceRange());
    this.errors.push(error);
    return error;
  }
}
