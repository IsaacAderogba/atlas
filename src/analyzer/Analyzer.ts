import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import {
  BlockStmt,
  BreakStmt,
  ContinueStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from "../ast/Stmt";
import { Token } from "../ast/Token";
import { SemanticError, SemanticErrors } from "../errors/SemanticError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { globals } from "../interpreter/globals";
import { Interpreter } from "../interpreter/Interpreter";
import { Scope } from "../utils/Scope";
import { Stack } from "../utils/Stack";
import { FunctionType } from "./Enums";

export class Analyzer implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly scopes = new Stack(Scope.fromGlobals(globals, () => true));
  private currentFunction = FunctionType.NONE;
  private loopDepth = 0;
  private errors: SemanticError[] = [];

  constructor(
    private readonly interpreter: Interpreter,
    private readonly statements: Stmt[]
  ) {}

  analyze(): { errors: SemanticError[] } {
    for (const statement of this.statements) {
      this.analyzeStmt(statement);
    }

    return { errors: this.errors };
  }

  private analyzeStmt(statement: Stmt): void {
    statement.accept(this);
  }

  private analyzeExpr(expression: Expr): void {
    expression.accept(this);
  }

  private analyzeFunction(func: FunctionStmt, type: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();

    for (const param of func.params) {
      this.declare(param.name);
      this.define(param.name);
    }
    this.analyzeBlock(func.body.statements);

    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private analyzeLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.size - 1; i >= 0; i--) {
      if (this.scopes.get(i)?.has(name.lexeme)) {
        return this.interpreter.resolve(expr, this.scopes.size - 1 - i);
      }
    }
  }

  analyzeBlock(statements: Stmt[]): void {
    for (const statement of statements) {
      this.analyzeStmt(statement);
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.analyzeBlock(stmt.statements);
    this.endScope();
  }

  visitBreakStmt(stmt: BreakStmt): void {
    if (this.loopDepth === 0) {
      this.error(stmt.token, SemanticErrors.prohibitedBreak());
    }
  }

  visitContinueStmt(stmt: ContinueStmt): void {
    if (this.loopDepth === 0) {
      this.error(stmt.token, SemanticErrors.prohibitedContinue());
    }
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.analyzeExpr(stmt.expression);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.analyzeFunction(stmt, FunctionType.FUNCTION);
  }

  visitIfStmt(stmt: IfStmt): void {
    this.analyzeExpr(stmt.condition);
    this.analyzeStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.analyzeStmt(stmt.elseBranch);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction === FunctionType.NONE) {
      this.error(stmt.keyword, SemanticErrors.prohibitedReturn());
    }
    this.analyzeExpr(stmt.value);
  }

  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name);
    this.analyzeExpr(stmt.initializer);
    this.define(stmt.name);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.analyzeExpr(stmt.condition);
    if (stmt.increment) this.analyzeExpr(stmt.increment);

    this.loopDepth++;
    this.analyzeStmt(stmt.body);
    this.loopDepth--;
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.analyzeExpr(expr.value);
    this.analyzeLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.analyzeExpr(expr.left);
    this.analyzeExpr(expr.right);
  }

  visitCallExpr(expr: CallExpr): void {
    this.analyzeExpr(expr.callee);

    for (const argument of expr.args) {
      this.analyzeExpr(argument);
    }
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.analyzeExpr(expr.expression);
  }

  visitLiteralExpr(): void {
    // no op
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.analyzeExpr(expr.left);
    this.analyzeExpr(expr.right);
  }

  visitTernaryExpr(expr: TernaryExpr): void {
    this.analyzeExpr(expr.expression);
    this.analyzeExpr(expr.thenBranch);
    this.analyzeExpr(expr.elseBranch);
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.analyzeExpr(expr.right);
  }

  visitVariableExpr(expr: VariableExpr): void {
    const scope = this.scopes.peek();
    if (scope && scope.get(expr.name.lexeme) === false) {
      this.error(expr, SemanticErrors.prohibitedVariableInitializer());
    }

    this.analyzeLocal(expr, expr.name);
  }

  private beginScope(): void {
    this.scopes.push(new Scope());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    const scope = this.scopes.peek();
    if (!scope) return;
    if (scope.has(name.lexeme)) {
      this.error(name, SemanticErrors.prohibitedRedeclaration());
    }

    scope.set(name.lexeme, false);
  }

  private define(name: Token): void {
    const scope = this.scopes.peek();
    if (!scope) return;
    scope.set(name.lexeme, true);
  }

  private error(
    source: SourceRangeable,
    message: SourceMessage
  ): SemanticError {
    const error = new SemanticError(message, source.sourceRange());
    this.errors.push(error);
    return error;
  }
}
