import { Parameter } from "../ast/Node";
import { ObjectType } from "./AtlasObject";

export class GenericParamType extends ObjectType {
  readonly type = "GenericParam";

  constructor(public param: Parameter) {
    super();
  }

  static init = (param: Parameter): GenericParamType => new GenericParamType(param);
  init: typeof GenericParamType.init = (...args) => GenericParamType.init(...args);

  toString = (): string => this.type;
}

export const isGenericType = (value: unknown): value is GenericParamType =>
  value instanceof GenericParamType;
