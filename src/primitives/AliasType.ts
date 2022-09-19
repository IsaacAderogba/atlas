import { GenericTypeMap } from "../typechecker/GenericTypeMap";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { GenericType } from "./GenericType";

export class AliasType extends ObjectType {
  readonly type = "Alias";

  constructor(
    readonly name: string,
    readonly wrapped: AtlasType,
    generics: GenericType[] = []
  ) {
    super({}, generics);
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return this;
  }

  init = (
    name: string,
    wrapped: AtlasType,
    generics: GenericType[] = []
  ): AliasType => {
    return new AliasType(name, wrapped, generics);
  };

  toString = (): string => this.name;
}

export const isAliasType = (value: AtlasType): value is AliasType =>
  value.type === "Alias";
