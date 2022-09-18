import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class UnknownType extends ObjectType {
  readonly type = "Unknown";

  static init = (): UnknownType => new UnknownType();
  init: typeof UnknownType.init = (...args) => UnknownType.init(...args);

  toString = (): string => this.type;
}

export const isUnknownType = (value: AtlasType): value is UnknownType =>
  value.type === "Unknown";
