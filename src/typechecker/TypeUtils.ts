import { ExprVisitor, FunctionExpr, TypeExprVisitor } from "../ast/Expr";
import { StmtVisitor } from "../ast/Stmt";
import { AtlasType } from "../primitives/AtlasType";
import { FunctionEnum } from "../utils/Enums";

export type TypeVisitor = ExprVisitor<AtlasType> &
  TypeExprVisitor<AtlasType> &
  StmtVisitor<void>;

export type CurrentFunction = {
  enumType: FunctionEnum;
  expr: FunctionExpr;
  expected: AtlasType;
  returns?: AtlasType;
};
