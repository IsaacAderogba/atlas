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

export const atlasNull = (): AtlasNull => new AtlasNull();

export class NullType extends ObjectType {
  readonly type = "Null";

  toString = (): string => this.type;
}

export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";
