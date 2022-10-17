import {
  attachGenericString,
  GenericTypeMap,
  GenericVisitedMap,
} from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AliasType extends ObjectType {
  readonly type = "Alias";

  constructor(
    readonly name: string,
    readonly wrapped: AtlasType,
    generics: AtlasType[] = []
  ) {
    super({}, generics);
  }

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): AtlasType {
    return this.wrapped.bindGenerics(genericTypeMap, visited);
  }

  init = (
    name: string,
    wrapped: AtlasType,
    generics: AtlasType[] = []
  ): AliasType => {
    return new AliasType(name, wrapped, generics);
  };

  toString = (): string => {
    return `${this.name}${attachGenericString(this.generics)}`;
  };
}

export const isAliasType = (value: AtlasType): value is AliasType =>
  value.type === "Alias";
