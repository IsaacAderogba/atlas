import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AtlasBoolean extends AtlasObject {
  readonly type = "Boolean";

  constructor(readonly value: true | false) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}

export const atlasBoolean = (value: true | false): AtlasBoolean =>
  new AtlasBoolean(value);

export class BooleanType extends ObjectType {
  readonly type = "Boolean";

  toString = (): string => this.type;
}

export const isBooleanType = (type: AtlasType): type is BooleanType =>
  type.type === "Boolean";
