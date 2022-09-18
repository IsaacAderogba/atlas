import { ObjectType } from "./AtlasObject";

export class NeverType extends ObjectType {
  readonly type = "Never";

  isSubtype(): boolean {
    return false;
  }

  static init = (): NeverType => new NeverType();
  init: typeof NeverType.init = (...args) => NeverType.init(...args);

  toString = (): string => this.type;
}

export const isNeverType = (value: unknown): value is NeverType =>
  value instanceof NeverType;
