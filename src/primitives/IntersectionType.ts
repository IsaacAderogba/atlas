import { GenericTypeMap, GenericVisitedMap } from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class IntersectionType extends ObjectType {
  readonly type = "Intersection";

  constructor(readonly types: AtlasType[]) {
    super();
  }

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): AtlasType {
    const types = this.types.map(type =>
      type.bindGenerics(genericTypeMap, visited)
    );
    return this.init(types);
  }

  init = (types: AtlasType[]): IntersectionType => new IntersectionType(types);

  toString = (): string => this.types.map(type => type.toString()).join(" & ");
}

export const isIntersectionType = (
  value: AtlasType
): value is IntersectionType => value.type === "Intersection";
