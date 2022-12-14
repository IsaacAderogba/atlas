import { SourceRange, SourceRangeable } from "../errors/SourceError";
import { SyntaxError } from "../errors/SyntaxError";
import type { Expr, TypeExpr } from "./Expr";
import type { Parameter, Property, TypeProperty } from "./Node";
import { Token } from "./Token";

interface BaseStmt extends SourceRangeable {
  accept<T>(visitor: StmtVisitor<T>): T;
}

export class BlockStmt implements BaseStmt {
  constructor(
    readonly open: Token,
    readonly statements: Stmt[],
    readonly close: Token
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.open.sourceRange();
    const { end } = this.open.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class BreakStmt implements BaseStmt {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBreakStmt(this);
  }

  sourceRange(): SourceRange {
    return this.keyword.sourceRange();
  }
}

export class ClassStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly parameters: Parameter[],
    readonly typeExpr: TypeExpr | undefined,
    readonly open: Token,
    readonly properties: Property[],
    readonly close: Token
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ContinueStmt implements BaseStmt {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitContinueStmt(this);
  }

  sourceRange(): SourceRange {
    return this.keyword.sourceRange();
  }
}

export class ErrorStmt implements BaseStmt {
  constructor(readonly error: SyntaxError) {}

  accept<T>(): T {
    throw new Error("ErrorStmt should not be executed.");
  }

  sourceRange(): SourceRange {
    return this.error.sourceRange;
  }
}

export class ExpressionStmt implements BaseStmt {
  constructor(readonly expression: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }

  sourceRange(): SourceRange {
    return this.expression.sourceRange();
  }
}

export class IfStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch?: Stmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitIfStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();

    if (this.elseBranch) {
      return new SourceRange(file, start, this.elseBranch.sourceRange().end);
    } else {
      return new SourceRange(file, start, this.thenBranch.sourceRange().end);
    }
  }
}

export class ImportStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly modulePath: Token
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitImportStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class InterfaceStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly parameters: Parameter[],
    readonly open: Token,
    readonly entries: TypeProperty[],
    readonly close: Token
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitInterfaceStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.close.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ModuleStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly block: BlockStmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitModuleStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.name.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class PanicStmt {
  constructor(readonly keyword: Token, readonly value: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitPanicStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class ReturnStmt implements BaseStmt {
  constructor(readonly keyword: Token, readonly value: Expr) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitReturnStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.value.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class TypeStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly name: Token,
    readonly parameters: Parameter[],
    readonly type: TypeExpr
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitTypeStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.type.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class VarStmt implements BaseStmt {
  constructor(readonly keyword: Token, readonly property: Property) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.property.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export class WhileStmt implements BaseStmt {
  constructor(
    readonly keyword: Token,
    readonly condition: Expr,
    readonly body: Stmt
  ) {}

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitWhileStmt(this);
  }

  sourceRange(): SourceRange {
    const { file, start } = this.keyword.sourceRange();
    const { end } = this.body.sourceRange();
    return new SourceRange(file, start, end);
  }
}

export type Stmt =
  | BlockStmt
  | BreakStmt
  | ClassStmt
  | ContinueStmt
  | ErrorStmt
  | IfStmt
  | ImportStmt
  | InterfaceStmt
  | ModuleStmt
  | PanicStmt
  | ReturnStmt
  | TypeStmt
  | VarStmt
  | WhileStmt
  | ExpressionStmt;

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitBreakStmt(stmt: BreakStmt): T;
  visitClassStmt(stmt: ClassStmt): T;
  visitContinueStmt(stmt: ContinueStmt): T;
  visitErrorStmt?(stmt: ErrorStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitIfStmt(stmt: IfStmt): T;
  visitImportStmt(stmt: ImportStmt): T;
  visitInterfaceStmt(stmt: InterfaceStmt): T;
  visitModuleStmt(stmt: ModuleStmt): T;
  visitPanicStmt(stmt: PanicStmt): T;
  visitReturnStmt(stmt: ReturnStmt): T;
  visitTypeStmt(stmt: TypeStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitWhileStmt(stmt: WhileStmt): T;
}
