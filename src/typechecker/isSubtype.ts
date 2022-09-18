import { isAnyType } from "../primitives/AnyType";
import { isBooleanType } from "../primitives/AtlasBoolean";
import { isCallableType } from "../primitives/AtlasCallable";
import { isNullType } from "../primitives/AtlasNull";
import { isNumberType } from "../primitives/AtlasNumber";
import { isStringType } from "../primitives/AtlasString";
import { AtlasType } from "../primitives/AtlasType";
import { isInterfaceType } from "../primitives/InterfaceType";
import { isUnionType } from "../primitives/UnionType";

export const isSubtype = (a: AtlasType, b: AtlasType): boolean => {
  if (isAnyType(a) || isAnyType(b)) return true;

  if (isUnionType(a)) return a.types.every(a => isSubtype(a, b));
  if (isUnionType(b)) return b.types.some(b => isSubtype(a, b));

  if (isNullType(a) && isNullType(b)) return true;
  if (isBooleanType(a) && isBooleanType(b)) return true;
  if (isNumberType(a) && isNumberType(b)) return true;
  if (isStringType(a) && isStringType(b)) return true;

  if (isInterfaceType(a) && isInterfaceType(b)) {
    if (a === b) return true;

    const fields = [...b.fields.entries()].every(([name, type]) => {
      const compare = a.fields.get(name);
      if (compare) return isSubtype(compare, type);
      return false;
    });

    const methods = [...b.methods.entries()].every(([name, type]) => {
      const compare = a.methods.get(name);
      if (compare) return isSubtype(compare, type);
      return false;
    });

    return fields && methods;
  }

  if (isCallableType(a) && isCallableType(b)) {
    if (a.arity() !== b.arity()) return false;
    if (!isSubtype(a.returns, b.returns)) return false;
    return a.params.every((a, i) => isSubtype(b.params[i], a));
  }

  return false;
};
