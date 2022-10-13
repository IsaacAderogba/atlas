import { isAliasType } from "../primitives/AliasType";
import { isAnyType } from "../primitives/AnyType";
import { isBooleanType } from "../primitives/AtlasBoolean";
import { isCallableType } from "../primitives/AtlasCallable";
import { isListType } from "../primitives/AtlasList";
import { isNullType } from "../primitives/AtlasNull";
import { isNumberType } from "../primitives/AtlasNumber";
import { isRecordType } from "../primitives/AtlasRecord";
import { isStringType } from "../primitives/AtlasString";
import { AtlasType } from "../primitives/AtlasType";
import { isInterfaceType } from "../primitives/InterfaceType";
import { isIntersectionType } from "../primitives/IntersectionType";
import { isUnionType } from "../primitives/UnionType";
import { Stack } from "../utils/Stack";

export type SubtyperResponse = {
  isSubtype: boolean;
  error: string;
};

export const createSubtyper = (): ((
  a: AtlasType,
  b: AtlasType
) => SubtyperResponse) => {
  const errors: Stack<string> = new Stack();

  const error = (actualType: AtlasType, expectedType: AtlasType): void => {
    errors.push(
      `expected "${expectedType.toString()}", but got "${actualType.toString()}"`
    );
  };

  const isSubtype = (a: AtlasType, b: AtlasType): boolean => {
    if (a === b) return true;
    if (isAnyType(a) || isAnyType(b)) return true;

    if (isAliasType(a)) return isSubtype(a.wrapped, b);
    if (isAliasType(b)) return isSubtype(a, b.wrapped);

    if (isUnionType(a)) return a.types.every(a => isSubtype(a, b));
    if (isUnionType(b)) return b.types.some(b => isSubtype(a, b));

    if (isIntersectionType(a)) return a.types.some(a => isSubtype(a, b));
    if (isIntersectionType(b)) return b.types.every(b => isSubtype(a, b));

    if (isNullType(a) && isNullType(b)) return true;
    if (isBooleanType(a) && isBooleanType(b)) return true;
    if (isNumberType(a) && isNumberType(b)) return true;
    if (isStringType(a) && isStringType(b)) return true;

    if (isListType(a) && isListType(b)) {
      return isSubtype(a.itemType, b.itemType);
    } else if (isRecordType(a) && isRecordType(b)) {
      return isSubtype(a.itemType, b.itemType);
    } else if (isInterfaceType(a) && isInterfaceType(b)) {
      const succeeded = [...b.fields.entries()].every(([name, type]) => {
        const compare = a.fields.get(name);
        if (compare) return isSubtype(compare, type);
        // console.log("can't compare", name, { a, b });
        return false;
      });

      if (succeeded) return true;
    } else if (isCallableType(a) && isCallableType(b)) {
      const succeeded =
        a.arity() === b.arity() &&
        isSubtype(a.returns, b.returns) &&
        a.params.every((a, i) => isSubtype(b.params[i], a));

      if (succeeded) return true;
    }

    error(a, b);
    return false;
  };

  return (
    a: AtlasType,
    b: AtlasType
  ): { isSubtype: boolean; error: string } => {
    const result = isSubtype(a, b);
    let error = "";

    for (const message of errors) {
      error += `${message}\n`;
    }

    return { isSubtype: result, error };
  };
};
