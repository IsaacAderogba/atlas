import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AliasType extends ObjectType {
  readonly type = "Alias";

  constructor(readonly name: string, readonly wrapped: AtlasType) {
    super();
  }

  init = (name: string, wrapped: AtlasType): AliasType => {
    return new AliasType(name, wrapped);
  };

  toString = (): string => this.name;
}

export const isAliasType = (value: AtlasType): value is AliasType =>
  value.type === "Alias";
