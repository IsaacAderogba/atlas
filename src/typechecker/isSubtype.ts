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

  const isSubtype = (
    a: AtlasType,
    b: AtlasType,
    visited: Set<AtlasType>
  ): boolean => {
    if (a === b) return true;
    if (isAnyType(a) || isAnyType(b)) return true;

    if (isAliasType(a)) return isSubtype(a.wrapped, b, visited);
    if (isAliasType(b)) return isSubtype(a, b.wrapped, visited);

    if (isUnionType(a)) return a.types.every(a => isSubtype(a, b, visited));
    if (isUnionType(b)) return b.types.some(b => isSubtype(a, b, visited));

    if (isIntersectionType(a))
      return a.types.some(a => isSubtype(a, b, visited));
    if (isIntersectionType(b))
      return b.types.every(b => isSubtype(a, b, visited));

    if (isNullType(a) && isNullType(b)) return true;
    if (isBooleanType(a) && isBooleanType(b)) return true;
    if (isNumberType(a) && isNumberType(b)) return true;
    if (isStringType(a) && isStringType(b)) return true;

    if (isListType(a) && isListType(b)) {
      return isSubtype(a.itemType, b.itemType, visited);
    } else if (isRecordType(a) && isRecordType(b)) {
      return isSubtype(a.itemType, b.itemType, visited);
    } else if (isInterfaceType(a) && isInterfaceType(b)) {
      const succeeded = [...b.fields.entries()].every(([name, type]) => {
        const compare = a.fields.get(name);

        if (compare) {
          if (visited.has(compare)) return true;
          visited.add(compare);
          visited.add(type);
          return isSubtype(compare, type, visited);
        }
        return false;
      });

      if (succeeded) return true;
    } else if (isCallableType(a) && isCallableType(b)) {
      const succeeded =
        a.arity() === b.arity() &&
        isSubtype(a.returns, b.returns, visited) &&
        a.params.every((a, i) => isSubtype(b.params[i], a, visited));

      if (succeeded) return true;
    }

    error(a, b);
    return false;
  };

  return (
    a: AtlasType,
    b: AtlasType
  ): { isSubtype: boolean; error: string } => {
    console.log("compare", { a, b });
    const result = isSubtype(a, b, new Set());
    let error = "";

    for (const message of errors) {
      error += `${message}\n`;
    }

    return { isSubtype: result, error };
  };
};
