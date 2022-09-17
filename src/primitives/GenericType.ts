import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class GenericType extends ObjectType {
  readonly type = "Generic";

  constructor(public param: string) {
    super();
  }

  isSubtype(_candidate: AtlasType): boolean {
    return true;
  }

  static init = (param: string): GenericType => new GenericType(param);
  init: typeof GenericType.init = (...args) => GenericType.init(...args);

  toString = (): string => this.type;
}

export const isGenericType = (value: unknown): value is GenericType =>
  value instanceof GenericType;
