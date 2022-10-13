import { ExprVisitor, FunctionExpr, TypeExprVisitor } from "../ast/Expr";
import { StmtVisitor } from "../ast/Stmt";
import { ClassType } from "../primitives/AtlasClass";
import { AtlasType } from "../primitives/AtlasType";
import { ClassEnum, FunctionEnum } from "../utils/Enums";

export type TypeVisitor = ExprVisitor<AtlasType> &
  TypeExprVisitor<AtlasType> &
  StmtVisitor<void>;

export type TypeModuleEnv = {
  values: { [key: string]: AtlasType };
  types: { [key: string]: AtlasType };
};

export type CurrentFunction = {
  enumType: FunctionEnum;
  expr: FunctionExpr;
  expected: AtlasType;
  returns?: AtlasType;
};

export type CurrentClass = {
  enumType: ClassEnum;
  expected: ClassType;
};
