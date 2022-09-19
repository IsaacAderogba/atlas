import { GenericTypeMap } from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AnyType extends ObjectType {
  readonly type = "Any";

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return this;
  }

  toString = (): string => this.type;
}

export const isAnyType = (value: AtlasType): value is AnyType =>
  value.type === "Any";
