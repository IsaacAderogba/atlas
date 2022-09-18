import { ObjectType } from "./AtlasObject";

export class GenericType extends ObjectType {
  readonly type = "Generic";

  constructor(public param: string) {
    super();
  }

  static init = (param: string): GenericType => new GenericType(param);
  init: typeof GenericType.init = (...args) => GenericType.init(...args);

  toString = (): string => this.type;
}

export const isGenericType = (value: unknown): value is GenericType =>
  value instanceof GenericType;
