import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class UnknownType extends ObjectType {
  readonly type = "Unknown";

  init = (): UnknownType => new UnknownType();

  toString = (): string => this.type;
}

export const isUnknownType = (value: AtlasType): value is UnknownType =>
  value.type === "Unknown";
