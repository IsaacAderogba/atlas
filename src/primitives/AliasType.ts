import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { GenericParamType } from "./AtlasValue";

export class AliasType extends ObjectType {
  readonly type = "Alias";

  constructor(
    readonly name: string,
    readonly wrapped: AtlasType,
    generics: GenericParamType[] = []
  ) {
    super({}, generics);
  }

  init = (
    name: string,
    wrapped: AtlasType,
    generics: GenericParamType[] = []
  ): AliasType => {
    return new AliasType(name, wrapped, generics);
  };

  toString = (): string => this.name;
}

export const isAliasType = (value: AtlasType): value is AliasType =>
  value.type === "Alias";
