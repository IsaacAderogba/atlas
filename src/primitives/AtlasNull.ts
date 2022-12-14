import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AtlasNull extends AtlasObject {
  readonly type = "Null";

  constructor(readonly value: null = null) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}

export const atlasNull = new AtlasNull();

export class NullType extends ObjectType {
  readonly type = "Null";

  bindGenerics(): AtlasType {
    return this;
  }

  toString = (): string => this.type;
}

export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";

export const nullType = new NullType();
