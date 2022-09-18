import { isSubtype } from "../typechecker/isSubtype";
import { ObjectType } from "./AtlasObject";
import { AtlasType, Types } from "./AtlasType";
import { NeverType } from "./NeverType";

export class UnionType extends ObjectType {
  readonly type = "Union";

  constructor(readonly types: AtlasType[]) {
    super();
  }

  collapseSubtypes(ts: AtlasType[]): AtlasType[] {
    return ts.filter((t1, i1) =>
      ts.every(
        (t2, i2) =>
          i1 === i2 || !isSubtype(t1, t2) || (isSubtype(t2, t1) && i1 < i2)
      )
    );
  }

  flatten(ts: AtlasType[]): AtlasType[] {
    return ([] as AtlasType[]).concat(
      ...ts.map(t => (isUnionType(t) ? t.types : t))
    );
  }

  init = (types: AtlasType[]): AtlasType => {
    types = this.flatten(types);
    types = this.collapseSubtypes(types);
    if (types.length === 0) return Types.Never;
    if (types.length === 1) return types[0];
    return new UnionType(types);
  };

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isUnionType = (value: AtlasType): value is UnionType =>
  value.type === "Union";
