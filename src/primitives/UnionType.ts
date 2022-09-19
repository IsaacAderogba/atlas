import { GenericTypeMap } from "../typechecker/GenericTypeMap";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class UnionType extends ObjectType {
  readonly type = "Union";

  constructor(readonly types: AtlasType[]) {
    super();
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return this;
  }

  init = (types: AtlasType[]): AtlasType => new UnionType(types);

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isUnionType = (value: AtlasType): value is UnionType =>
  value.type === "Union";
