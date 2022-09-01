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
import { InterpreterError } from "./InterpreterError";
import { getBooleanValue, getNumberValue } from "./operands";

export class Interpreter implements ExprVisitor<AtlasValue> {
  private evaluate(expr: Expr): AtlasValue {
    return expr.accept(this);
  }

  visitTernaryExpr(expr: TernaryExpr): AtlasValue {
    const expression = this.evaluate(expr.expression);

    if (getBooleanValue(expression)) return this.evaluate(expr.thenBranch);
    return this.evaluate(expr.elseBranch);
  }

  visitBinaryExpr(expr: BinaryExpr): AtlasValue {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "PLUS":
        return new AtlasNumber(getNumberValue(left) + getNumberValue(right));
      case "MINUS":
        return new AtlasNumber(getNumberValue(left) - getNumberValue(right));
      case "SLASH":
        return new AtlasNumber(getNumberValue(left) / getNumberValue(right));
      case "STAR":
        return new AtlasNumber(getNumberValue(left) * getNumberValue(right));
      default:
        throw new InterpreterError(
          `Unexpected binary operator: ${expr.operator.lexeme}`
        );
    }
  }

  visitGroupingExpr(expr: GroupingExpr): AtlasValue {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: UnaryExpr): AtlasValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "BANG":
        return getBooleanValue(right) ? new AtlasFalse() : new AtlasTrue();
      case "MINUS":
        return new AtlasNumber(-getNumberValue(right));
      default:
        throw new InterpreterError(
          `Unexpected unary operator: ${expr.operator.lexeme}`
        );
    }
  }

  visitLiteralExpr(expr: LiteralExpr): AtlasValue {
    return expr.value;
  }
}
