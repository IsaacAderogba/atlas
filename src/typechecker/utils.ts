import { AtlasType, Types } from "../primitives/AtlasType";
import { isUnionType } from "../primitives/UnionType";

export function map(t: AtlasType, fn: (t: AtlasType) => AtlasType): AtlasType {
  if (isUnionType(t)) return Types.Union.init(t.types.map(fn));
  return fn(t);
}
