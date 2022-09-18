import { AtlasType, Types } from "../primitives/AtlasType";
import { isUnionType } from "../primitives/UnionType";

function mapThree(
  t1: AtlasType,
  t2: AtlasType,
  fn: (t1: AtlasType, t2: AtlasType) => AtlasType
): AtlasType {
  if (isUnionType(t1) || isUnionType(t2)) {
    const t1s = isUnionType(t1) ? t1.types : [t1];
    const t2s = isUnionType(t2) ? t2.types : [t2];
    const ts: AtlasType[] = [];
    for (const t1 of t1s) {
      for (const t2 of t2s) {
        ts.push(fn(t1, t2));
      }
    }
    return Types.Union.init(ts);
  } else {
    return fn(t1, t2);
  }
}

function mapTwo(t: AtlasType, fn: (t: AtlasType) => AtlasType): AtlasType {
  if (isUnionType(t)) return Types.Union.init(t.types.map(fn));
  return fn(t);
}

export const map: typeof mapTwo & typeof mapThree = (...args: any[]) => {
  switch (args.length) {
    case 2:
      return mapTwo(args[0], args[1]);
    case 3:
      return mapThree(args[0], args[1], args[2]);
    default:
      throw new Error("Error");
  }
};
