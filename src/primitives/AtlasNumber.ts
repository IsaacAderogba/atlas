import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AtlasNumber extends AtlasObject {
  readonly type = "Number";

  constructor(readonly value: number) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}

export class NumberType extends ObjectType {
  readonly type = "Number";

  bindGenerics(): AtlasType {
    return this;
  }

  toString = (): string => this.type;
}

export const isNumberType = (type: AtlasType): type is NumberType =>
  type.type === "Number";
