import {
  AssignExpr,
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import { AtlasFalse } from "./AtlasFalse";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasTrue } from "./AtlasTrue";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { areEqualValues } from "./operands";
import { SourceMessage, SourceRangeable } from "../utils/Source";
import {
  ExpressionStmt,
  PrintStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
} from "../ast/Stmt";
import { Reporter } from "../reporter/Reporter";
import { Environment } from "./Environment";

interface InterpreterProps {
  reporter: Reporter;
}

export class Interpreter implements ExprVisitor<AtlasValue>, StmtVisitor<void> {
  private environment = new Environment();
  private reporter: Reporter;

  constructor({ reporter }: InterpreterProps) {
    this.reporter = reporter;
  }

  interpret(statements: Stmt[]): { errors: RuntimeError[] } {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }

      return { errors: [] };
    } catch (error) {
      if (error instanceof RuntimeError) {
        return { errors: [error] };
      }
      throw error;
    }
  }

  evaluate(expr: Expr): AtlasValue {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    this.reporter.log(value.toString());
  }

  visitVarStmt(stmt: VarStmt): void {
    const value = this.evaluate(stmt.initializer);
    this.environment.define(stmt.name.lexeme, value, stmt.name);
  }

  visitAssignExpr(expr: AssignExpr): AtlasValue {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitTernaryExpr(expr: TernaryExpr): AtlasValue {
    const source = expr.expression;
    const expression = this.evaluate(source);

    if (this.getBooleanValue(source, expression)) {
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
        return isGreater ? new AtlasTrue() : new AtlasFalse();
      case "GREATER_EQUAL":
        const isGreaterEqual =
          this.getNumberValue(leftSource, left) >=
          this.getNumberValue(rightSource, right);
        return isGreaterEqual ? new AtlasTrue() : new AtlasFalse();
      case "LESS":
        const isLess =
          this.getNumberValue(leftSource, left) <
          this.getNumberValue(rightSource, right);
        return isLess ? new AtlasTrue() : new AtlasFalse();
      case "LESS_EQUAL":
        const isLessEqual =
          this.getNumberValue(leftSource, left) <=
          this.getNumberValue(rightSource, right);
        return isLessEqual ? new AtlasTrue() : new AtlasFalse();
      case "BANG_EQUAL":
        const areNotEqual = !areEqualValues(left, right);
        return areNotEqual ? new AtlasTrue() : new AtlasFalse();
      case "EQUAL_EQUAL":
        const areEqual = areEqualValues(left, right);
        return areEqual ? new AtlasTrue() : new AtlasFalse();
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
        return boolean ? new AtlasFalse() : new AtlasTrue();
      case "MINUS":
        return new AtlasNumber(-this.getNumberValue(source, right));
      default:
        throw this.error(
          expr.operator,
          RuntimeErrors.unexpectedUnaryOperator()
        );
    }
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasValue {
    return expr.value;
  }

  visitVariableExpr(expr: VariableExpr): AtlasValue {
    return this.environment.get(expr.name);
  }

  private getNumberValue(source: SourceRangeable, operand: AtlasValue): number {
    if (operand.type === "NUMBER") return operand.value;
    throw this.error(source, RuntimeErrors.expectedNumber());
  }

  private getBooleanValue(
    source: SourceRangeable,
    operand: AtlasValue
  ): boolean {
    if (operand.type === "TRUE") return operand.value;
    if (operand.type === "FALSE") return operand.value;
    throw this.error(source, RuntimeErrors.expectedBoolean());
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
