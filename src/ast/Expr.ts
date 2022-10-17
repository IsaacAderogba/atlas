import { SyntaxError } from "../errors/SyntaxError";
import { AtlasValue } from "../primitives/AtlasValue";
import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { Token } from "./Token";
import { Entry, Parameter } from "./Node";
import type { BlockStmt } from "./Stmt";
import { AtlasType } from "../primitives/AtlasType";

interface BaseExpr extends SourceRangeable {
  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T;
}

export class AssignExpr implements BaseExpr {
  constructor(readonly name: Token, readonly value: Expr) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitAssignExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.name.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class TernaryExpr implements BaseExpr {
  constructor(
    readonly expression: Expr,
    readonly thenBranch: Expr,
    readonly elseBranch: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitTernaryExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.expression.sourceRange();
    const { end } = this.elseBranch.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class BinaryExpr implements BaseExpr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitBinaryExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.left.sourceRange();
    const { end } = this.right.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class CallExpr implements BaseExpr {
  constructor(
    readonly callee: Expr,
    readonly typeExprs: TypeExpr[],
    readonly open: Token,
    readonly args: Expr[],
    readonly close: Token
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitCallExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.callee.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class FunctionExpr implements BaseExpr {
  constructor(
    readonly keyword: Token,
    readonly params: Parameter[],
    readonly body: BlockStmt
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitFunctionExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.body.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export const isFunctionExpr = (value: unknown): value is FunctionExpr =>
  value instanceof FunctionExpr;

export class GetExpr implements BaseExpr {
  constructor(readonly object: Expr, readonly name: Token) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitGetExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.object.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class GroupingExpr implements BaseExpr {
  constructor(
    readonly open: Token,
    readonly expression: Expr,
    readonly close: Token
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitGroupingExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.open.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class SetExpr {
  constructor(
    readonly object: Expr,
    readonly name: Token,
    readonly value: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitSetExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.object.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ThisExpr {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitThisExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.keyword.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class UnaryExpr implements BaseExpr {
  constructor(readonly operator: Token, readonly right: Expr) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitUnaryExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.operator.sourceRange();
    const { end } = this.right.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class LiteralExpr implements BaseExpr {
  constructor(readonly token: Token, readonly value: AtlasValue) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitLiteralExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.token.sourceRange();
    const { end } = this.token.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ListExpr implements BaseExpr {
  constructor(
    readonly open: Token,
    readonly items: Expr[],
    readonly close: Token
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitListExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.open.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class LogicalExpr implements BaseExpr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitLogicalExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.left.sourceRange();
    const { end } = this.right.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ErrorExpr implements BaseExpr {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorExpr should not be evaluated.");
  }

  sourceRange(): SourceRange {
    return this.error.sourceRange;
  }
}

export class RecordExpr implements BaseExpr {
  constructor(
    readonly open: Token,
    readonly entries: Entry[],
    readonly close: Token
  ) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitRecordExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.open.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class VariableExpr {
  constructor(readonly name: Token) {}

  accept<T>(visitor: ExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitVariableExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.name.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export type Expr =
  | AssignExpr
  | TernaryExpr
  | BinaryExpr
  | CallExpr
  | ErrorExpr
  | FunctionExpr
  | GetExpr
  | GroupingExpr
  | LiteralExpr
  | ListExpr
  | LogicalExpr
  | RecordExpr
  | SetExpr
  | ThisExpr
  | UnaryExpr
  | VariableExpr;

export interface ExprVisitor<T> {
  visitAssignExpr(expr: AssignExpr, type?: AtlasType): T;
  visitBinaryExpr(expr: BinaryExpr, type?: AtlasType): T;
  visitCallExpr(expr: CallExpr, type?: AtlasType): T;
  visitFunctionExpr(expr: FunctionExpr, type?: AtlasType): T;
  visitGetExpr(expr: GetExpr, type?: AtlasType): T;
  visitTernaryExpr(expr: TernaryExpr, type?: AtlasType): T;
  visitGroupingExpr(expr: GroupingExpr, type?: AtlasType): T;
  visitLiteralExpr(expr: LiteralExpr, type?: AtlasType): T;
  visitListExpr(expr: ListExpr, type?: AtlasType): T;
  visitLogicalExpr(expr: LogicalExpr, type?: AtlasType): T;
  visitRecordExpr(expr: RecordExpr, type?: AtlasType): T;
  visitSetExpr(expr: SetExpr, type?: AtlasType): T;
  visitThisExpr(expr: ThisExpr, type?: AtlasType): T;
  visitUnaryExpr(expr: UnaryExpr, type?: AtlasType): T;
  visitVariableExpr(expr: VariableExpr, type?: AtlasType): T;
}

interface BaseTypeExpr extends SourceRangeable {
  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T;
}

export class CallableTypeExpr {
  constructor(
    readonly params: Parameter[],
    readonly open: Token,
    readonly paramTypes: TypeExpr[],
    readonly returnType: TypeExpr
  ) {}

  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitCallableTypeExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.open.sourceRange();
    const { end } = this.returnType.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export const isCallableTypeExpr = (value: unknown): value is CallableTypeExpr =>
  value instanceof CallableTypeExpr;

export class CompositeTypeExpr implements BaseTypeExpr {
  constructor(
    readonly left: TypeExpr,
    readonly operator: Token,
    readonly right: TypeExpr
  ) {}

  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitCompositeTypeExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.left.sourceRange();
    const { end } = this.right.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class GetTypeExpr implements BaseTypeExpr {
  constructor(readonly object: TypeExpr, readonly name: Token) {}

  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitGetTypeExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.object.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class GenericTypeExpr implements BaseTypeExpr {
  constructor(readonly callee: TypeExpr, readonly typeExprs: TypeExpr[]) {}

  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitGenericTypeExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.callee.sourceRange();
    const { end } = this.callee.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class SubTypeExpr implements BaseTypeExpr {
  constructor(readonly name: Token) {}

  accept<T>(visitor: TypeExprVisitor<T>, type?: AtlasType): T {
    return visitor.visitSubTypeExpr(this, type);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.name.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export const isSubTypeExpr = (value: unknown): value is SubTypeExpr =>
  value instanceof SubTypeExpr;

export type TypeExpr =
  | CallableTypeExpr
  | CompositeTypeExpr
  | GetTypeExpr
  | GenericTypeExpr
  | SubTypeExpr;

export interface TypeExprVisitor<T> {
  visitCallableTypeExpr(typeExpr: CallableTypeExpr, type?: AtlasType): T;
  visitCompositeTypeExpr(typeExpr: CompositeTypeExpr, type?: AtlasType): T;
  visitGetTypeExpr(typeExpr: GetTypeExpr, type?: AtlasType): T;
  visitGenericTypeExpr(typeExpr: GenericTypeExpr, type?: AtlasType): T;
  visitSubTypeExpr(typeExpr: SubTypeExpr, type?: AtlasType): T;
}
