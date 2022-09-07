import {
  BinaryExpr,
  TernaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ErrorExpr,
  VariableExpr,
  AssignExpr,
  LogicalExpr,
  CallExpr,
  FunctionExpr,
  GetExpr,
  SetExpr,
} from "../ast/Expr";
import {
  BlockStmt,
  BreakStmt,
  ClassStmt,
  ContinueStmt,
  ErrorStmt,
  ExpressionStmt,
  IfStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { SyntaxError, SyntaxErrors } from "../errors/SyntaxError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { Property, Parameter } from "../ast/Node";

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

    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration());
      } catch (error) {
        if (!(error instanceof ErrorStmt)) throw error;
        statements.push(error);
      }
    }

    return { statements, errors: this.errors };
  }

  private declaration(): Stmt {
    try {
      if (this.match("CLASS")) return this.classDeclaration();
      if (this.match("VAR")) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (error instanceof SyntaxError) throw this.errorStatement(error);
      throw error;
    }
  }

  private classDeclaration(): ClassStmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    const open = this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());

    const props: Property[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      props.push(this.property());
    }

    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );

    return new ClassStmt(keyword, name, open, props, close);
  }

  private varDeclaration(): VarStmt {
    return new VarStmt(this.previous(), this.property());
  }

  private statement(): Stmt {
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("LEFT_BRACE")) return this.blockStatement();
    if (this.match("BREAK")) return this.breakStatement();
    if (this.match("CONTINUE")) return this.continueStatement();

    return this.expressionStatement();
  }

  private returnStatement(): ReturnStmt {
    const keyword = this.previous();
    const value = this.expression();
    this.consume("SEMICOLON", SyntaxErrors.expectedSemiColon());

    return new ReturnStmt(keyword, value);
  }

  private whileStatement(): WhileStmt {
    const keyword = this.previous();
    this.consume("LEFT_PAREN", SyntaxErrors.expectedLeftParen());
    const condition = this.expression();
    const increment = this.match("SEMICOLON") ? this.expression() : undefined;
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    const body = this.statement();
    return new WhileStmt(keyword, condition, increment, body);
  }

  private ifStatement(): IfStmt {
    const keyword = this.previous();
    this.consume("LEFT_PAREN", SyntaxErrors.expectedLeftParen());
    const condition = this.expression();
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    const thenBranch = this.statement();
    const elseBranch = this.match("ELSE") ? this.statement() : undefined;

    return new IfStmt(keyword, condition, thenBranch, elseBranch);
  }

  private breakStatement(): BreakStmt {
    const token = this.previous();
    this.consume("SEMICOLON", SyntaxErrors.expectedSemiColon());
    return new BreakStmt(token);
  }

  private continueStatement(): ContinueStmt {
    const token = this.previous();
    this.consume("SEMICOLON", SyntaxErrors.expectedSemiColon());
    return new ContinueStmt(token);
  }

  private blockStatement(): BlockStmt {
    const open = this.previous();
    const statements: Stmt[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );
    return new BlockStmt(open, statements, close);
  }

  private expressionStatement(): ExpressionStmt {
    const value = this.expression();
    this.consume("SEMICOLON", SyntaxErrors.expectedSemiColon());
    return new ExpressionStmt(value);
  }

  public expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.ternary();

    if (this.match("EQUAL")) {
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        return new AssignExpr(expr.name, value);
      } else if (expr instanceof GetExpr) {
        return new SetExpr(expr.object, expr.name, value);
      }

      this.error(expr, SyntaxErrors.invalidAssignmentTarget());
    }

    return expr;
  }

  private ternary(): Expr {
    let expr = this.or();

    if (this.match("QUESTION")) {
      const thenBranch = this.ternary();
      this.consume("COLON", SyntaxErrors.expectedColon());
      const elseBranch = this.ternary();
      expr = new TernaryExpr(expr, thenBranch, elseBranch);
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match("OR")) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match("AND")) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpr(expr, operator, right);
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

    while (this.match("MINUS", "PLUS", "HASH")) {
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

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match("LEFT_PAREN")) {
        const open = this.previous();
        const args = this.arguments();
        const close = this.consume(
          "RIGHT_PAREN",
          SyntaxErrors.expectedRightParen()
        );

        expr = new CallExpr(open, expr, args, close);
      } else if (this.match("DOT")) {
        const name = this.consume(
          "IDENTIFIER",
          SyntaxErrors.expectedIdentifier()
        );
        expr = new GetExpr(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match("NUMBER", "STRING", "FALSE", "TRUE", "NULL")) {
      const token = this.previous();
      return new LiteralExpr(token, token.literal!);
    }

    if (this.match("IDENTIFIER")) {
      return new VariableExpr(this.previous());
    }

    if (this.match("FUNCTION")) {
      return this.func();
    }

    if (this.match("LEFT_PAREN")) {
      const open = this.previous();
      const expr = this.expression();
      const close = this.consume(
        "RIGHT_PAREN",
        SyntaxErrors.expectedRightParen()
      );
      return new GroupingExpr(open, expr, close);
    }

    return this.errorExpression();
  }

  private func(): FunctionExpr {
    const keyword = this.previous();
    this.consume("LEFT_PAREN", SyntaxErrors.expectedLeftParen());
    const parameters = this.parameters();
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());

    const body = this.blockStatement();
    return new FunctionExpr(keyword, parameters, body);
  }

  private errorStatement(err: SyntaxError): ErrorStmt {
    this.advance();

    while (!this.isAtEnd()) {
      // if (this.previous().type === "SEMICOLON") return new ErrorStmt(err);

      switch (this.peek().type) {
        case "BREAK":
        case "CONTINUE":
        case "CLASS":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "RETURN":
          return new ErrorStmt(err);
      }

      this.advance();
    }

    return new ErrorStmt(err);
  }

  private errorExpression(): ErrorExpr {
    const leftOperandErrs: [TokenType[], () => Expr][] = [
      [["OR"], this.or.bind(this)],
      [["AND"], this.and.bind(this)],
      [["BANG_EQUAL", "EQUAL_EQUAL"], this.equality.bind(this)],
      [
        ["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"],
        this.comparison.bind(this),
      ],
      [["PLUS", "HASH"], this.term.bind(this)],
      [["SLASH", "STAR"], this.comparison.bind(this)],
    ];

    for (const [types, expr] of leftOperandErrs) {
      if (this.match(...types)) {
        const error = new ErrorExpr(
          this.error(this.previous(), SyntaxErrors.expectedLeftOperand())
        );
        expr();
        return error;
      }
    }

    throw this.error(this.peek(), SyntaxErrors.expectedExpression());
  }

  private arguments(): Expr[] {
    const args: Expr[] = [];

    if (!this.check("RIGHT_PAREN")) {
      do {
        args.push(this.expression());
      } while (this.match("COMMA"));
    }

    return args;
  }

  private parameters(): Parameter[] {
    const params: Parameter[] = [];
    if (!this.check("RIGHT_PAREN")) {
      do {
        params.push(this.parameter());
      } while (this.match("COMMA"));
    }

    return params;
  }

  private parameter(): Parameter {
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedParameter());
    return new Parameter(name);
  }

  private property(): Property {
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    this.consume("EQUAL", SyntaxErrors.expectedAssignment());
    const initializer = this.expression();

    const isFunc = initializer instanceof FunctionExpr;
    if (!isFunc) {
      this.consume("SEMICOLON", SyntaxErrors.expectedSemiColon());
    }

    return new Property(name, initializer);
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

  private consume(type: TokenType, message: SourceMessage): Token {
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

  private error(source: SourceRangeable, message: SourceMessage): SyntaxError {
    const error = new SyntaxError(message, source.sourceRange());
    this.errors.push(error);
    return error;
  }
}
