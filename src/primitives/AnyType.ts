import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class AnyType extends ObjectType {
  readonly type = "Any";

  isSubtype(_candidate: AtlasType): boolean {
    return true;
  }

  static init = (): AnyType => new AnyType();
  init: typeof AnyType.init = () => AnyType.init();

  toString = (): string => this.type;
}

export const isAnyType = (value: unknown): value is AnyType =>
  value instanceof AnyType;
