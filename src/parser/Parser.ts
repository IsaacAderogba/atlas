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
  ThisExpr,
  ListExpr,
  RecordExpr,
  TypeExpr,
  CompositeTypeExpr,
  SubTypeExpr,
  CallableTypeExpr,
  ObjectTypeExpr,
  GenericTypeExpr,
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
  TypeStmt,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { Token } from "../ast/Token";
import { TokenType } from "../ast/TokenType";
import { SyntaxError, SyntaxErrors } from "../errors/SyntaxError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { Property, Parameter, Entry, TypeEntry } from "../ast/Node";

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
      if (this.match("TYPE")) return this.typeDeclaration();
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
    const statics: Property[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const array = this.match("STATIC") ? statics : props;
      array.push(this.property());
    }

    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );

    return new ClassStmt(keyword, name, open, props, statics, close);
  }

  private typeDeclaration(): Stmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());

    let parameters: Parameter[] = [];
    if (this.match("LEFT_BRACKET")) {
      parameters = this.parameters();
      this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
    }

    this.consume("EQUAL", SyntaxErrors.expectedAssignment());
    const type = this.typeExpr();

    return new TypeStmt(keyword, name, parameters, type);
  }

  private varDeclaration(): VarStmt {
    return new VarStmt(this.previous(), this.property());
  }

  private statement(): Stmt {
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("LEFT_BRACE")) return this.blockStatement();
    if (this.match("BREAK")) return new BreakStmt(this.previous());
    if (this.match("CONTINUE")) return new ContinueStmt(this.previous());

    return this.expressionStatement();
  }

  private returnStatement(): ReturnStmt {
    const keyword = this.previous();
    const value = this.expression();
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
      if (this.check("LEFT_PAREN") || this.check("LEFT_BRACKET")) {
        let open: Token | null = null;

        let generics: TypeExpr[] = [];
        if (this.match("LEFT_BRACKET")) {
          open = this.previous();
          generics = this.generics("RIGHT_BRACKET");
          this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
        }

        const token = this.consume(
          "LEFT_PAREN",
          SyntaxErrors.expectedLeftParen()
        );
        if (!open) open = token;

        const args = this.expressions("RIGHT_PAREN");
        const close = this.consume(
          "RIGHT_PAREN",
          SyntaxErrors.expectedRightParen()
        );

        expr = new CallExpr(open, expr, generics, args, close);
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

    if (this.match("THIS")) return new ThisExpr(this.previous());
    if (this.match("IDENTIFIER")) return new VariableExpr(this.previous());
    if (this.match("FUNCTION")) return this.func();
    if (this.match("LEFT_BRACKET")) return this.list();
    if (this.match("LEFT_BRACE")) return this.record();

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
    const async = this.match("STAR") ? this.previous() : undefined;
    this.consume("LEFT_PAREN", SyntaxErrors.expectedLeftParen());

    const parameters = this.parameters();
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());

    const body = this.blockStatement();
    return new FunctionExpr(keyword, async, parameters, body);
  }

  private list(): ListExpr {
    const open = this.previous();
    const items = this.expressions("RIGHT_BRACKET");
    const close = this.consume(
      "RIGHT_BRACKET",
      SyntaxErrors.expectedRightBracket()
    );

    return new ListExpr(open, items, close);
  }

  private record(): RecordExpr {
    const open = this.previous();
    const entries = this.entries();
    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );

    return new RecordExpr(open, entries, close);
  }

  private errorStatement(err: SyntaxError): ErrorStmt {
    this.advance();

    while (!this.isAtEnd()) {
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

    if (this.match("SEMICOLON")) {
      return new ErrorExpr(
        this.error(this.previous(), SyntaxErrors.invalidSemiColon())
      );
    }

    throw this.error(this.peek(), SyntaxErrors.expectedExpression());
  }

  private typeExpr(): TypeExpr {
    let typeExpr = this.subTypeExpr();

    while (this.match("PIPE") || this.match("AMPERSAND")) {
      const operator = this.previous();
      const right = this.subTypeExpr();

      typeExpr = new CompositeTypeExpr(typeExpr, operator, right);
    }

    return typeExpr;
  }

  private subTypeExpr(): TypeExpr {
    if (this.match("LEFT_PAREN")) return this.callableTypeExpr();
    if (this.match("LEFT_BRACE")) return this.objectTypeExpr();

    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());

    let generics: TypeExpr[] = [];
    if (this.match("LEFT_BRACKET")) {
      generics = this.generics("RIGHT_BRACKET");
      this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
    }

    if (generics.length > 0) return new GenericTypeExpr(name, generics);

    return new SubTypeExpr(name);
  }

  private callableTypeExpr(): TypeExpr {
    const open = this.previous();
    const generics = this.generics("RIGHT_PAREN");
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    this.consume("MINUS", SyntaxErrors.expectedDash());
    const close = this.consume("GREATER", SyntaxErrors.expectedRightCaret());
    const returnType = this.typeExpr();

    return new CallableTypeExpr(open, generics, close, returnType);
  }

  private objectTypeExpr(): TypeExpr {
    const open = this.previous();

    const entries: TypeEntry[] = [];

    if (!this.check("RIGHT_BRACE")) {
      do {
        const key = this.consume(
          "IDENTIFIER",
          SyntaxErrors.expectedIdentifier()
        );
        this.consume("COLON", SyntaxErrors.expectedSemiColon());
        const value = this.typeExpr();

        entries.push(new TypeEntry(key, value));
      } while (this.match("COMMA"));
    }

    const close = this.consume(
      "RIGHT_BRACKET",
      SyntaxErrors.expectedRightBracket()
    );

    return new ObjectTypeExpr(open, entries, close);
  }

  private expressions(type: TokenType): Expr[] {
    const args: Expr[] = [];

    if (!this.check(type)) {
      do {
        args.push(this.expression());
      } while (this.match("COMMA"));
    }

    return args;
  }

  private entries(): Entry[] {
    const entries: Entry[] = [];

    if (!this.check("RIGHT_BRACE")) {
      do {
        const key = this.consume("STRING", SyntaxErrors.expectedString());
        this.consume("COLON", SyntaxErrors.expectedSemiColon());
        const value = this.expression();

        entries.push(new Entry(key, value));
      } while (this.match("COMMA"));
    }

    return entries;
  }

  private generics(type: TokenType): TypeExpr[] {
    const generics: TypeExpr[] = [];

    if (!this.check(type)) {
      do {
        generics.push(this.typeExpr());
      } while (this.match("COMMA"));
    }

    return generics;
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
    const type = this.match("COLON") ? this.typeExpr() : undefined;
    this.consume("EQUAL", SyntaxErrors.expectedAssignment());
    const initializer = this.expression();

    return new Property(name, type, initializer);
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
