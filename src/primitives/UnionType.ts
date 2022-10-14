import { GenericTypeMap, GenericVisitedMap } from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class UnionType extends ObjectType {
  readonly type = "Union";

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

  init = (types: AtlasType[]): AtlasType => new UnionType(types);

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isUnionType = (value: AtlasType): value is UnionType =>
  value.type === "Union";
