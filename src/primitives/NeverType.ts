import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class NeverType extends ObjectType {
  readonly type = "Never";

  init = (): NeverType => new NeverType();

  toString = (): string => this.type;
}

export const isNeverType = (value: AtlasType): value is NeverType =>
  value.type === "Never";
