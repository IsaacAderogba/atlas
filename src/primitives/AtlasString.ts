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

  static init = (): StringType => new StringType();
  init: typeof StringType.init = () => StringType.init();

  toString = (): string => this.type;
}

export const isStringType = (type: AtlasType): type is StringType =>
  type.type === "String";
