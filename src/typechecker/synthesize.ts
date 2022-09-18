import { AtlasType, Types } from "../primitives/AtlasType";
import { isIntersectionType } from "../primitives/IntersectionType";
import { isUnionType } from "../primitives/UnionType";

function synthesizeBinary(
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
        ts.push(synthesize(t1, t2, fn));
      }
    }
    return Types.Union.init(ts);
  } else if (isIntersectionType(t1) && isIntersectionType(t2)) {
    const t1s = isIntersectionType(t1) ? t1.types : [t1];
    const t2s = isIntersectionType(t2) ? t2.types : [t2];
    const ts: AtlasType[] = [];
    for (const t1 of t1s) {
      for (const t2 of t2s) {
        ts.push(synthesize(t1, t2, fn));
      }
    }
    return Types.Union.init(ts);
  } else {
    return fn(t1, t2);
  }
}

function synthesizeTwo(
  t: AtlasType,
  fn: (t: AtlasType) => AtlasType
): AtlasType {
  if (isUnionType(t)) {
    return Types.Union.init(t.types.map(t => synthesize(t, fn)));
  } else if (isIntersectionType(t)) {
    return Types.Intersection.init(t.types.map(t => synthesize(t, fn)));
  } else {
    return fn(t);
  }
}

export const synthesize: typeof synthesizeTwo & typeof synthesizeBinary = (
  ...args: any[]
) => {
  switch (args.length) {
    case 2:
      return synthesizeTwo(args[0], args[1]);
    case 3:
      return synthesizeBinary(args[0], args[1], args[2]);
    default:
      throw new Error("Error");
  }
};
