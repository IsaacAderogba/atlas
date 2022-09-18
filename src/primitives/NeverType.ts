import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class NeverType extends ObjectType {
  readonly type = "Never";

  static init = (): NeverType => new NeverType();
  init: typeof NeverType.init = (...args) => NeverType.init(...args);

  toString = (): string => this.type;
}

export const isNeverType = (value: AtlasType): value is NeverType =>
  value.type === "Never"
