import { Token } from "../ast/Token";
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
          i1 === i2 || !t1.isSubtype(t2) || (t2.isSubtype(t1) && i1 < i2)
      )
    );
  }

  flatten(ts: AtlasType[]): AtlasType[] {
    return ([] as AtlasType[]).concat(
      ...ts.map(t => (isUnionType(t) ? t.types : t))
    );
  }

  isSubtype(candidate: AtlasType): boolean {
    return true;
  }

  static init = (types: AtlasType[]): UnionType => new UnionType(types);
  init: typeof UnionType.init = (...args) => UnionType.init(...args);

  toString = (): string => this.types.map(type => type.toString()).join(" | ");
}

export const isUnionType = (value: unknown): value is UnionType =>
  value instanceof UnionType;
