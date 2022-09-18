import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AnyType extends ObjectType {
  readonly type = "Any";

  static init = (): AnyType => new AnyType();
  init: typeof AnyType.init = () => AnyType.init();

  toString = (): string => this.type;
}

export const isAnyType = (value: AtlasType): value is AnyType =>
  value.type === "Any";
