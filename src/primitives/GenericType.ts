import { GenericTypeMap } from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class GenericType extends ObjectType {
  readonly type = "Generic";

  constructor(public name: string, public constraint?: AtlasType) {
    super();
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return genericTypeMap.get(this) ?? this;
  }

  init = (name: string, constraint?: AtlasType): GenericType =>
    new GenericType(name, constraint);

  toString = (): string => this.name;
}

export const isGenericType = (value: unknown): value is GenericType =>
  value instanceof GenericType;
