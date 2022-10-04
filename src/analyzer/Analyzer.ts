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
  ImportStmt,
  ModuleStmt,
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
import { Scope } from "../utils/Scope";
import { Stack } from "../utils/Stack";
import { ClassType, FunctionEnum, VariableState } from "../utils/Enums";
import { AtlasAPI } from "../AtlasAPI";
import { isAtlasString } from "../primitives/AtlasString";

type AnalyzerScope = Scope<{ state: VariableState; source?: SourceRangeable }>;
type CurrentFunction = { type: FunctionEnum; expr: FunctionExpr };

const globalScope = (): AnalyzerScope =>
  Scope.fromGlobals(globals, () => ({ state: VariableState.DEFINED }));

export class Analyzer implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Stack<AnalyzerScope> = new Stack();
  private currentFunction?: CurrentFunction;
  private currentClass = ClassType.NONE;
  private loopDepth = 0;
  private errors: SemanticError[] = [];

  constructor(
    private readonly atlas: AtlasAPI,
    private readonly statements: Stmt[]
  ) {}

  analyze(): { errors: SemanticError[] } {
    this.beginScope(globalScope());
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

  private analyzeProperty(prop: Property, type: FunctionEnum): void {
    if (prop.initializer instanceof FunctionExpr) {
      this.declare(prop.name);
      this.define(prop.name);
      this.analyzeFunction(prop.initializer, { type, expr: prop.initializer });
    } else {
      this.declare(prop.name);
      if (prop.initializer) this.analyzeExpr(prop.initializer);
      this.define(prop.name);
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
    this.getScope().set("this", { state: VariableState.DEFINED });
    for (const prop of stmt.properties) {
      const isInit = prop.name.lexeme === "init";
      const method = isInit ? FunctionEnum.INIT : FunctionEnum.METHOD;

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

  visitImportStmt(stmt: ImportStmt): void {
    if (!isAtlasString(stmt.modulePath.literal)) throw new Error("invariant");

    this.atlas.reader.readFile(
      stmt.modulePath.literal.value,
      ({ statements, errors }) => {
        if (this.atlas.reportErrors(errors)) process.exit(65);
        this.visitModule(stmt.name, statements);
      }
    );
  }

  visitModuleStmt(stmt: ModuleStmt): void {
    this.visitModule(stmt.name, stmt.block.statements);
  }

  visitModule(name: Token, statements: Stmt[]): void {
    this.withModuleScope(() => {
      const scope: AnalyzerScope = new Scope();
      this.beginScope(scope);
      this.analyzeBlock(statements);
      this.endScope();
      return scope;
    });

    this.declare(name);
    this.define(name);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction) {
      const { type } = this.currentFunction;

      switch (type) {
        case FunctionEnum.INIT:
          this.error(stmt.keyword, SemanticErrors.prohibitedInitReturn());
          break;
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
    this.analyzeProperty(stmt.property, FunctionEnum.FUNCTION);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.analyzeExpr(stmt.condition);

    this.loopDepth++;
    this.analyzeStmt(stmt.body);
    this.loopDepth--;
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.analyzeExpr(expr.value);
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
    this.analyzeFunction(expr, { expr, type: FunctionEnum.FUNCTION });
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
  }

  private withModuleScope<T extends AnalyzerScope>(callback: () => T): T {
    const enclosingScopes = this.scopes;
    this.scopes = new Stack();

    this.beginScope(globalScope());
    const scope = callback();
    this.endScope();

    this.scopes = enclosingScopes;
    return scope;
  }

  private beginScope(scope: AnalyzerScope = new Scope()): void {
    this.scopes.push(scope);
  }

  private endScope(): void {
    this.scopes.pop();
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
