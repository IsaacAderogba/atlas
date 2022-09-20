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
  GenericTypeExpr,
  GetTypeExpr,
} from "../ast/Expr";
import {
  BlockStmt,
  BreakStmt,
  ClassStmt,
  ContinueStmt,
  ErrorStmt,
  ExpressionStmt,
  IfStmt,
  ImportStmt,
  InterfaceStmt,
  ModuleStmt,
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
import { Property, Parameter, Entry, TypeProperty } from "../ast/Node";
import { Keywords } from "./Keywords";

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
      if (this.match("MODULE")) return this.moduleDeclaration();
      if (this.match("IMPORT")) return this.importDeclaration();
      if (this.match("CLASS")) return this.classDeclaration();
      if (this.match("TYPE")) return this.typeDeclaration();
      if (this.match("INTERFACE")) return this.interfaceDeclaration();
      if (this.match("VAR")) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (error instanceof SyntaxError) throw this.errorStatement(error);
      throw error;
    }
  }

  private moduleDeclaration(): ModuleStmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());
    const block = this.blockStatement();
    return new ModuleStmt(keyword, name, block);
  }

  private importDeclaration(): ImportStmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    this.consume("FROM", SyntaxErrors.expectedFromKeyword());
    const modulePath = this.consume("STRING", SyntaxErrors.expectedString());
    return new ImportStmt(keyword, name, modulePath);
  }

  private classDeclaration(): ClassStmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    const parameters = this.typeParameters();
    const typeExpr = this.match("IMPLEMENTS") ? this.typeExpr() : undefined;
    const open = this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());

    const props: Property[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      props.push(this.property(() => this.name()));
    }

    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );

    return new ClassStmt(
      keyword,
      name,
      parameters,
      typeExpr,
      open,
      props,
      close
    );
  }

  private typeDeclaration(): Stmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    const parameters = this.typeParameters();
    this.consume("EQUAL", SyntaxErrors.expectedAssignment());
    const type = this.typeExpr();

    return new TypeStmt(keyword, name, parameters, type);
  }

  private interfaceDeclaration(): InterfaceStmt {
    const keyword = this.previous();
    const name = this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier());
    const parameters = this.typeParameters();
    const open = this.consume("LEFT_BRACE", SyntaxErrors.expectedLeftBrace());
    const props: TypeProperty[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const key = this.name();
      this.consume("COLON", SyntaxErrors.expectedColon());
      const value = this.typeExpr();

      props.push(new TypeProperty(key, value));
    }

    const close = this.consume(
      "RIGHT_BRACE",
      SyntaxErrors.expectedRightBrace()
    );

    return new InterfaceStmt(keyword, name, parameters, open, props, close);
  }

  private varDeclaration(): VarStmt {
    return new VarStmt(
      this.previous(),
      this.property(() =>
        this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier())
      )
    );
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
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    const body = this.statement();
    return new WhileStmt(keyword, condition, body);
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

    while (this.match("PIPE_PIPE")) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match("AMPERSAND_AMPERSAND")) {
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
        let typeExprs: TypeExpr[] = [];
        if (this.match("LEFT_BRACKET")) {
          typeExprs = this.typeExprs("RIGHT_BRACKET");
          this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
        }

        const open = this.consume(
          "LEFT_PAREN",
          SyntaxErrors.expectedLeftParen()
        );

        const args = this.expressions("RIGHT_PAREN");
        const close = this.consume(
          "RIGHT_PAREN",
          SyntaxErrors.expectedRightParen()
        );

        expr = new CallExpr(expr, typeExprs, open, args, close);
      } else if (this.match("DOT")) {
        expr = new GetExpr(expr, this.name());
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

    const parameters = this.parameters("RIGHT_PAREN");
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
      [["PIPE_PIPE"], this.or.bind(this)],
      [["AMPERSAND_AMPERSAND"], this.and.bind(this)],
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
    return this.orTypeExpr();
  }

  private orTypeExpr(): TypeExpr {
    let typeExpr = this.andTypeExpr();

    while (this.match("PIPE")) {
      const or = this.previous();
      const right = this.andTypeExpr();

      typeExpr = new CompositeTypeExpr(typeExpr, or, right);
    }

    return typeExpr;
  }

  private andTypeExpr(): TypeExpr {
    let typeExpr = this.genericTypeExpr();

    while (this.match("AMPERSAND")) {
      const and = this.previous();
      const right = this.genericTypeExpr();

      typeExpr = new CompositeTypeExpr(typeExpr, and, right);
    }

    return typeExpr;
  }

  private genericTypeExpr(): TypeExpr {
    let typeExpr = this.subTypeExpr();

    while (true) {
      if (this.match("LEFT_BRACKET")) {
        const typeExprs = this.typeExprs("RIGHT_BRACKET");
        this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
        typeExpr = new GenericTypeExpr(typeExpr, typeExprs);
      } else if (this.match("DOT")) {
        typeExpr = new GetTypeExpr(
          typeExpr,
          this.consume("IDENTIFIER", SyntaxErrors.expectedIdentifier())
        );
      } else {
        break;
      }
    }

    return typeExpr;
  }

  private subTypeExpr(): TypeExpr {
    if (this.check("LEFT_PAREN") || this.check("LEFT_BRACKET")) {
      return this.callableTypeExpr();
    }

    return new SubTypeExpr(this.name());
  }

  private callableTypeExpr(): TypeExpr {
    const parameters = this.typeParameters();
    const open = this.consume("LEFT_PAREN", SyntaxErrors.expectedLeftParen());
    const typeExprs = this.typeExprs("RIGHT_PAREN");
    this.consume("RIGHT_PAREN", SyntaxErrors.expectedRightParen());

    this.consume("MINUS", SyntaxErrors.expectedDash());
    this.consume("GREATER", SyntaxErrors.expectedRightCaret());
    const returnType = this.typeExpr();

    return new CallableTypeExpr(parameters, open, typeExprs, returnType);
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

  private typeExprs(type: TokenType): TypeExpr[] {
    const typeExprs: TypeExpr[] = [];

    if (!this.check(type)) {
      do {
        typeExprs.push(this.typeExpr());
      } while (this.match("COMMA"));
    }

    return typeExprs;
  }

  private typeParameters(): Parameter[] {
    let parameters: Parameter[] = [];
    if (this.match("LEFT_BRACKET")) {
      parameters = this.parameters("RIGHT_BRACKET");
      this.consume("RIGHT_BRACKET", SyntaxErrors.expectedRightBracket());
    }
    return parameters;
  }

  private parameters(type: TokenType): Parameter[] {
    const params: Parameter[] = [];
    if (!this.check(type)) {
      do {
        const name = this.consume(
          "IDENTIFIER",
          SyntaxErrors.expectedParameter()
        );
        const baseType = this.match("IS") ? this.typeExpr() : undefined;
        const param = new Parameter(name, baseType);

        params.push(param);
      } while (this.match("COMMA"));
    }

    return params;
  }

  private property(consume: () => Token): Property {
    const name = consume();
    const type = this.match("COLON") ? this.typeExpr() : undefined;
    this.consume("EQUAL", SyntaxErrors.expectedAssignment());
    const initializer = this.expression();

    return new Property(name, type, initializer);
  }

  private name(): Token {
    if (this.match("IDENTIFIER")) return this.previous();
    for (const [_, keyword] of Keywords) {
      if (this.match(keyword)) return this.previous();
    }

    throw this.error(this.peek(), SyntaxErrors.expectedIdentifier());
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
