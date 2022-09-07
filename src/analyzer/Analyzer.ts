import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  FunctionExpr,
  GetExpr,
  GroupingExpr,
  LogicalExpr,
  SetExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import { Property } from "../ast/Node";
import {
  BlockStmt,
  BreakStmt,
  ClassStmt,
  ContinueStmt,
  ExpressionStmt,
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
import { FunctionType, VariableState } from "./Enums";

type AnalyzerScope = Scope<{ state: VariableState; source?: SourceRangeable }>;

export class Analyzer implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly scopes: Stack<AnalyzerScope> = new Stack();
  private currentFunction = FunctionType.NONE;
  private loopDepth = 0;
  private errors: SemanticError[] = [];

  constructor(
    private readonly interpreter: Interpreter,
    private readonly statements: Stmt[]
  ) {}

  analyze(): { errors: SemanticError[] } {
    this.beginScope(
      Scope.fromGlobals(globals, () => ({ state: VariableState.SETTLED }))
    );
    for (const statement of this.statements) {
      this.analyzeStmt(statement);
    }
    this.endScope();

    return { errors: this.errors };
  }

  private analyzeStmt(statement: Stmt): void {
    statement.accept(this);
  }

  private analyzeExpr(expression: Expr): void {
    expression.accept(this);
  }

  private analyzeFunction(func: FunctionExpr, type: FunctionType): void {
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

  private analyzeProperty(prop: Property, type: FunctionType): void {
    if (prop.initializer instanceof FunctionExpr) {
      this.declare(prop.name);
      this.define(prop.name);
      this.analyzeFunction(prop.initializer, type);
    } else {
      this.declare(prop.name);
      this.analyzeExpr(prop.initializer);
      this.define(prop.name);
    }
  }

  private analyzeLocal(expr: Expr, name: Token, isSettled: boolean): void {
    for (let i = this.scopes.size - 1; i >= 0; i--) {
      const scope = this.scopes.get(i);
      if (scope && scope.has(name.lexeme)) {
        const entry = scope.get(name.lexeme);
        if (isSettled && entry) entry.state = VariableState.SETTLED;
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

  visitClassStmt(stmt: ClassStmt): void {
    this.declare(stmt.name);

    for (const prop of stmt.properties) {
      const method = FunctionType.METHOD;
      this.analyzeProperty(prop, method);
    }

    this.define(stmt.name);
  }

  visitBreakStmt(stmt: BreakStmt): void {
    if (this.loopDepth === 0) {
      this.error(stmt.keyword, SemanticErrors.prohibitedBreak());
    }
  }

  visitContinueStmt(stmt: ContinueStmt): void {
    if (this.loopDepth === 0) {
      this.error(stmt.keyword, SemanticErrors.prohibitedContinue());
    }
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.analyzeExpr(stmt.expression);
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
    this.analyzeProperty(stmt.property, FunctionType.FUNCTION);
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
    this.analyzeLocal(expr, expr.name, false);
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

  visitGetExpr(expr: GetExpr): void {
    this.analyzeExpr(expr.object);
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.analyzeExpr(expr.expression);
  }

  visitFunctionExpr(expr: FunctionExpr): void {
    this.analyzeFunction(expr, FunctionType.FUNCTION);
  }

  visitLiteralExpr(): void {
    // no op
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.analyzeExpr(expr.left);
    this.analyzeExpr(expr.right);
  }

  visitSetExpr(expr: SetExpr): void {
    this.analyzeExpr(expr.value);
    this.analyzeExpr(expr.object);
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
    if (
      scope &&
      scope.get(expr.name.lexeme)?.state === VariableState.DECLARED
    ) {
      this.error(expr, SemanticErrors.prohibitedVariableInitializer());
    }

    this.analyzeLocal(expr, expr.name, true);
  }

  private beginScope(scope: AnalyzerScope = new Scope()): void {
    this.scopes.push(scope);
  }

  private endScope(): void {
    const scope = this.scopes.pop();

    if (scope) {
      for (const { state, source } of scope.values()) {
        if (state === VariableState.DEFINED && source) {
          this.error(source, SemanticErrors.unusedVariable());
        }
      }
    }
  }

  private declare(name: Token): void {
    const scope = this.scopes.peek();
    if (!scope) return;
    if (scope.has(name.lexeme)) {
      this.error(name, SemanticErrors.prohibitedRedeclaration());
    }

    scope.set(name.lexeme, { state: VariableState.DECLARED, source: name });
  }

  private define(name: Token): void {
    const scope = this.scopes.peek();
    if (!scope) return;
    scope.set(name.lexeme, { state: VariableState.DEFINED, source: name });
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
