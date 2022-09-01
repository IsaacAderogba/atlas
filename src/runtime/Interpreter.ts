import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  TernaryExpr,
  UnaryExpr,
} from "../ast/Expr";
import { AtlasFalse } from "./AtlasFalse";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasTrue } from "./AtlasTrue";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError } from "./RuntimeError";
import { areEqualValues } from "./operands";
import { SourceRangeable } from "../utils/SourceRange";
import { Errors } from "../utils/Errors";

export class Interpreter implements ExprVisitor<AtlasValue> {
  private errors: RuntimeError[] = [];

  interpret(expression: Expr): {
    value: AtlasValue | null;
    errors: RuntimeError[];
  } {
    try {
      this.errors = [];
      const value = this.evaluate(expression);
      return { value, errors: [] };
    } catch (error) {
      return { value: null, errors: this.errors };
    }
  }

  evaluate(expr: Expr): AtlasValue {
    return expr.accept(this);
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
          throw this.error(rightSource, Errors.ProhibitedZeroDivision);
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
        throw this.error(expr.operator, Errors.UnexpectedBinaryOperator);
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
        throw this.error(expr.operator, Errors.UnexpectedUnaryOperator);
    }
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasValue {
    return expr.value;
  }

  private getNumberValue(source: SourceRangeable, operand: AtlasValue): number {
    if (operand.type === "NUMBER") return operand.value;
    throw this.error(source, Errors.ExpectedNumber);
  }

  private getBooleanValue(
    source: SourceRangeable,
    operand: AtlasValue
  ): boolean {
    if (operand.type === "TRUE") return operand.value;
    if (operand.type === "FALSE") return operand.value;
    throw this.error(source, Errors.ExpectedBoolean);
  }

  private error(source: SourceRangeable, message: string): RuntimeError {
    const error = new RuntimeError(message, source.sourceRange());
    this.errors.push(error);
    return error;
  }
}
