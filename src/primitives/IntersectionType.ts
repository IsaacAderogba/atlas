import { isSubtype } from "../typechecker/isSubtype";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class IntersectionType extends ObjectType {
  readonly type = "Intersection";

  constructor(readonly types: AtlasType[]) {
    super();
  }

  static init = (types: AtlasType[]): IntersectionType =>
    new IntersectionType(types);
  init: typeof IntersectionType.init = (...args) =>
    IntersectionType.init(...args);

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isIntersectionType = (
  value: AtlasType
): value is IntersectionType => value.type === "Intersection";
