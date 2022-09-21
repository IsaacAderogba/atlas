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
  LiteralExpr,
  LogicalExpr,
  RecordExpr,
  SetExpr,
  TernaryExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import { AtlasNumber } from "../primitives/AtlasNumber";
import { AtlasValue } from "../primitives/AtlasValue";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { areEqualValues } from "./operands";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import {
  BlockStmt,
  ClassStmt,
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
import { Environment } from "./Environment";
import { AtlasCallable, isCallable } from "../primitives/AtlasCallable";
import { globals } from "../globals";
import { AtlasFunction } from "../primitives/AtlasFunction";
import { Break, Continue, Return } from "./Throws";
import { AtlasString, isAtlasString } from "../primitives/AtlasString";
import { Token } from "../ast/Token";
import { AtlasNull } from "../primitives/AtlasNull";
import { AtlasClass } from "../primitives/AtlasClass";
import { NativeError } from "../errors/NativeError";
import { AtlasList } from "../primitives/AtlasList";
import { AtlasRecord } from "../primitives/AtlasRecord";
import { Scheduler } from "./Scheduler";
import { atlasBoolean } from "../primitives/AtlasBoolean";
import { AtlasModule } from "../primitives/AtlasModule";
import { AtlasAPI } from "../AtlasAPI";

export class Interpreter implements ExprVisitor<AtlasValue>, StmtVisitor<void> {
  readonly globals: Environment = Environment.fromGlobals(globals);
  private environment = this.globals;
  readonly scheduler = new Scheduler();
  private readonly locals: Map<Expr, number> = new Map();

  constructor(private readonly atlas: AtlasAPI) {}

  interpret(statements: Stmt[]): { errors: RuntimeError[] } {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }

      this.scheduler.run();
      return { errors: [] };
    } catch (error) {
      if (error instanceof RuntimeError) return { errors: [error] };

      throw error;
    }
  }

  evaluate(expr: Expr): AtlasValue {
    return expr.accept(this);
  }

  execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth);
  }

  interpretBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;

    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.interpretBlock(stmt.statements, new Environment(this.environment));
  }

  visitClassStmt(stmt: ClassStmt): void {
    this.environment.define(stmt.name.lexeme, new AtlasNull());

    const props: { [key: string]: AtlasValue } = {};
    for (const { name, initializer: expr } of stmt.properties) {
      const value =
        expr instanceof FunctionExpr
          ? new AtlasFunction(expr, this.environment, name.lexeme === "init")
          : this.evaluate(expr);

      props[name.lexeme] = value;
    }
    const atlasClass = new AtlasClass(stmt.name.lexeme, props);

    this.environment.assign(stmt.name, atlasClass);
  }

  visitBreakStmt(): void {
    throw new Break();
  }

  visitContinueStmt(): void {
    throw new Continue();
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitVarStmt(stmt: VarStmt): void {
    const value = this.evaluate(stmt.property.initializer);
    this.environment.define(stmt.property.name.lexeme, value);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (
      this.getBooleanValue(stmt.condition, this.evaluate(stmt.condition))
    ) {
      try {
        this.execute(stmt.body);
      } catch (err) {
        if (err instanceof Break) break;
        if (err instanceof Continue) continue;
        throw err;
      }
    }
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = this.evaluate(stmt.value);
    throw new Return(value);
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.getBooleanValue(stmt.condition, this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
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

  visitModule(name: Token, statements: Stmt[]): Environment {
    const env = new Environment(this.environment);
    this.interpretBlock(statements, env);
    this.environment.define(
      name.lexeme,
      new AtlasModule(name.lexeme, env.values)
    );

    return env;
  }

  visitTypeStmt(): void {
    // no op
  }

  visitAssignExpr(expr: AssignExpr): AtlasValue {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  visitTernaryExpr(expr: TernaryExpr): AtlasValue {
    if (this.getBooleanValue(expr.expression, this.evaluate(expr.expression))) {
      return this.evaluate(expr.thenBranch);
    }
    return this.evaluate(expr.elseBranch);
  }

  visitBinaryExpr(expr: BinaryExpr): AtlasValue {
    const leftSource = expr.left;
    const rightSource = expr.right;

    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "HASH":
        return new AtlasString(
          this.getStringValue(leftSource, left) +
            this.getStringValue(rightSource, right)
        );
      case "PLUS":
        return new AtlasNumber(
          this.getNumberValue(leftSource, left) +
            this.getNumberValue(rightSource, right)
        );
      case "MINUS":
        return new AtlasNumber(
          this.getNumberValue(leftSource, left) -
            this.getNumberValue(rightSource, right)
        );
      case "SLASH":
        const numerator = this.getNumberValue(leftSource, left);
        const denominator = this.getNumberValue(rightSource, right);
        if (denominator === 0) {
          throw this.error(rightSource, RuntimeErrors.prohibitedZeroDivision());
        }
        return new AtlasNumber(numerator / denominator);
      case "STAR":
        return new AtlasNumber(
          this.getNumberValue(leftSource, left) *
            this.getNumberValue(rightSource, right)
        );
      case "GREATER":
        const isGreater =
          this.getNumberValue(leftSource, left) >
          this.getNumberValue(rightSource, right);
        return atlasBoolean(isGreater);
      case "GREATER_EQUAL":
        const isGreaterEqual =
          this.getNumberValue(leftSource, left) >=
          this.getNumberValue(rightSource, right);
        return atlasBoolean(isGreaterEqual);
      case "LESS":
        const isLess =
          this.getNumberValue(leftSource, left) <
          this.getNumberValue(rightSource, right);
        return atlasBoolean(isLess);
      case "LESS_EQUAL":
        const isLessEqual =
          this.getNumberValue(leftSource, left) <=
          this.getNumberValue(rightSource, right);
        return atlasBoolean(isLessEqual);
      case "BANG_EQUAL":
        const areNotEqual = !areEqualValues(left, right);
        return atlasBoolean(areNotEqual);
      case "EQUAL_EQUAL":
        const areEqual = areEqualValues(left, right);
        return atlasBoolean(areEqual);
      default:
        throw this.error(
          expr.operator,
          RuntimeErrors.unexpectedBinaryOperator()
        );
    }
  }

  visitGroupingExpr(expr: GroupingExpr): AtlasValue {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: UnaryExpr): AtlasValue {
    const source = expr.right;
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "BANG":
        const boolean = this.getBooleanValue(source, right);
        return atlasBoolean(boolean ? false : true);
      case "MINUS":
        return new AtlasNumber(-this.getNumberValue(source, right));
      default:
        throw this.error(
          expr.operator,
          RuntimeErrors.unexpectedUnaryOperator()
        );
    }
  }

  visitCallExpr(expr: CallExpr): AtlasValue {
    const callee = this.getCallable(expr.callee, this.evaluate(expr.callee));
    const args = expr.args.map(arg => this.evaluate(arg));

    if (callee.arity() !== args.length) {
      throw this.error(
        expr.close,
        RuntimeErrors.mismatchedArity(callee.arity(), args.length)
      );
    }

    try {
      return callee.call(this, args);
    } catch (err) {
      if (err instanceof NativeError) throw this.error(expr, err.sourceMessage);
      throw err;
    }
  }

  visitGetExpr(expr: GetExpr): AtlasValue {
    const object = this.evaluate(expr.object);
    return object.get(expr.name);
  }

  visitFunctionExpr(expr: FunctionExpr): AtlasFunction {
    return new AtlasFunction(expr, this.environment, false);
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasValue {
    return expr.value;
  }

  visitLogicalExpr(expr: LogicalExpr): AtlasValue {
    const left = this.evaluate(expr.left);

    switch (expr.operator.type) {
      case "PIPE_PIPE":
        if (this.getBooleanValue(expr.left, left)) return left;
        break;
      case "AMPERSAND_AMPERSAND":
        if (!this.getBooleanValue(expr.left, left)) return left;
        break;
      default:
        throw this.error(
          expr.operator,
          RuntimeErrors.unexpectedLogicalOperator()
        );
    }
    return this.evaluate(expr.right);
  }

  visitListExpr(expr: ListExpr): AtlasValue {
    return new AtlasList(expr.items.map(item => this.evaluate(item)));
  }

  visitRecordExpr(expr: RecordExpr): AtlasValue {
    const entries: { [key: string]: AtlasValue } = {};

    for (const { key, value } of expr.entries) {
      const string = this.getStringValue(expr, key.literal as AtlasString);
      entries[string] = this.evaluate(value);
    }

    return new AtlasRecord(entries);
  }

  visitSetExpr(expr: SetExpr): AtlasValue {
    const object = this.evaluate(expr.object);
    const value = this.evaluate(expr.value);

    object.set(expr.name, value);
    return value;
  }

  visitThisExpr(expr: ThisExpr): AtlasValue {
    return this.lookupVariable(expr.keyword, expr);
  }

  visitVariableExpr(expr: VariableExpr): AtlasValue {
    return this.lookupVariable(expr.name, expr);
  }

  private lookupVariable(name: Token, expr: Expr): AtlasValue {
    const distance = this.locals.get(expr);

    if (distance !== undefined) {
      try {
        return this.environment.getAt(name.lexeme, distance, name);
      } catch {
        console.log("fall back");
        return this.environment.getAt(name.lexeme, distance + 1, name);
      }
    }
    return this.globals.get(name);
  }

  private getStringValue(source: SourceRangeable, operand: AtlasValue): string {
    if (operand.type === "String") return operand.value;
    throw this.error(source, RuntimeErrors.expectedString());
  }

  private getNumberValue(source: SourceRangeable, operand: AtlasValue): number {
    if (operand.type === "Number") return operand.value;
    throw this.error(source, RuntimeErrors.expectedNumber());
  }

  private getBooleanValue(
    source: SourceRangeable,
    operand: AtlasValue
  ): boolean {
    if (operand.type === "Boolean") return operand.value;
    throw this.error(source, RuntimeErrors.expectedBoolean());
  }

  private getCallable(
    source: SourceRangeable,
    operand: AtlasValue
  ): AtlasCallable {
    if (isCallable(operand)) return operand;
    throw this.error(source, RuntimeErrors.expectedCallable());
  }

  error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
