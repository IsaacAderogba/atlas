import { isSubtype } from "../typechecker/isSubtype";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class UnionType extends ObjectType {
  readonly type = "Union";
  readonly types: AtlasType[];

  constructor(types: AtlasType[]) {
    super();
    this.types = this.collapseSubtypes(this.flatten(types));
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

  static init = (types: AtlasType[]): UnionType => new UnionType(types);
  init: typeof UnionType.init = (...args) => UnionType.init(...args);

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isUnionType = (value: AtlasType): value is UnionType =>
  value.type === "Union";
