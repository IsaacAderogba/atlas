import { Parameter } from "../ast/Node";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class GenericType extends ObjectType {
  readonly type = "Generic";

  constructor(public param: Parameter, public constraint?: AtlasType) {
    super();
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return genericTypeMap.get(this) ?? this;
  }

  init = (param: Parameter, constraint?: AtlasType): GenericType =>
    new GenericType(param, constraint);

  toString = (): string => this.param.name.lexeme;
}

export const isGenericType = (value: unknown): value is GenericType =>
  value instanceof GenericType;
