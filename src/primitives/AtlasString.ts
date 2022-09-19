import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AtlasString extends AtlasObject {
  readonly type = "String";

  constructor(readonly value: string) {
    super({});
  }

  toString(): string {
    return this.value;
  }
}

export const atlasString = (value: string): AtlasString =>
  new AtlasString(value);

export class StringType extends ObjectType {
  readonly type = "String";

  bindGenerics(): AtlasType {
    return this;
  }

  toString = (): string => this.type;
}

export const isStringType = (type: AtlasType): type is StringType =>
  type.type === "String";
