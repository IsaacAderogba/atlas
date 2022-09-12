import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  FunctionExpr,
  GetExpr,
  GroupingExpr,
  ListExpr,
  LogicalExpr,
  RecordExpr,
  SetExpr,
  TernaryExpr,
  ThisExpr,
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
import { globals } from "../globals";
import { Interpreter } from "../runtime/Interpreter";
import { Scope } from "../utils/Scope";
import { Stack } from "../utils/Stack";
import { ClassType, FunctionType, VariableState } from "./Enums";

type AnalyzerScope = Scope<{ state: VariableState; source?: SourceRangeable }>;
type CurrentFunction = { type: FunctionType; expr: FunctionExpr };

export class Analyzer implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly scopes: Stack<AnalyzerScope> = new Stack();
  private currentFunction?: CurrentFunction;
  private currentClass = ClassType.NONE;
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

  private analyzeFunction(func: FunctionExpr, current: CurrentFunction): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = current;

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
      if (type === FunctionType.INIT && prop.initializer.async) {
        this.error(prop.name, SemanticErrors.prohibitedAsyncInit());
      }

      this.declare(prop.name);
      this.define(prop.name);
      this.analyzeFunction(prop.initializer, { type, expr: prop.initializer });
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
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    this.declare(stmt.name);
    this.define(stmt.name);

    this.beginScope();
    this.getScope().set("this", { state: VariableState.SETTLED });
    for (const prop of stmt.statics) {
      this.analyzeProperty(prop, FunctionType.METHOD);
    }
    this.endScope();

    this.beginScope();
    this.getScope().set("this", { state: VariableState.SETTLED });
    for (const prop of stmt.properties) {
      const isInit = prop.name.lexeme === "init";
      const method = isInit ? FunctionType.INIT : FunctionType.METHOD;

      this.analyzeProperty(prop, method);
    }
    this.endScope();

    this.currentClass = enclosingClass;
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

  visitInterfaceStmt(): void {
    // no op
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction) {
      const { type, expr } = this.currentFunction;

      switch (type) {
        case FunctionType.INIT:
          this.error(stmt.keyword, SemanticErrors.prohibitedInitReturn());
          break;
        case FunctionType.FUNCTION:
        case FunctionType.METHOD:
          if (expr.async) {
            this.error(stmt.keyword, SemanticErrors.prohibitedAsyncReturn());
          }
      }
    } else {
      this.error(stmt.keyword, SemanticErrors.prohibitedFunctionReturn());
    }

    this.analyzeExpr(stmt.value);
  }

  visitTypeStmt(): void {
    // no op
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
    this.analyzeFunction(expr, { expr, type: FunctionType.FUNCTION });
  }

  visitLiteralExpr(): void {
    // no op
  }

  visitListExpr(expr: ListExpr): void {
    for (const item of expr.items) {
      this.analyzeExpr(item);
    }
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.analyzeExpr(expr.left);
    this.analyzeExpr(expr.right);
  }

  visitRecordExpr(expr: RecordExpr): void {
    for (const item of expr.entries) {
      this.analyzeExpr(item.value);
    }
  }

  visitSetExpr(expr: SetExpr): void {
    this.analyzeExpr(expr.value);
    this.analyzeExpr(expr.object);
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClass === ClassType.NONE) {
      this.error(expr.keyword, SemanticErrors.prohibitedThis());
    }
    this.analyzeLocal(expr, expr.keyword, true);
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

    if (scope && this.currentClass === ClassType.NONE) {
      for (const { state, source } of scope.values()) {
        if (state === VariableState.DEFINED && source) {
          this.error(source, SemanticErrors.unusedVariable());
        }
      }
    }
  }

  private declare(name: Token): void {
    const scope = this.getScope();
    if (scope.has(name.lexeme)) {
      this.error(name, SemanticErrors.prohibitedRedeclaration());
    }

    scope.set(name.lexeme, { state: VariableState.DECLARED, source: name });
  }

  private define(name: Token): void {
    const scope = this.getScope();
    scope.set(name.lexeme, { state: VariableState.DEFINED, source: name });
  }

  private getScope(): AnalyzerScope {
    const scope = this.scopes.peek();
    if (!scope) throw new Error("Expected scope");
    return scope;
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
