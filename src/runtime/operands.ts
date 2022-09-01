import { AtlasValue } from "./AtlasValue";

export const areEqualValues = (
  left: AtlasValue,
  right: AtlasValue
): boolean => {
  const types: AtlasValue["type"][] = [
    "NULL",
    "STRING",
    "NUMBER",
    "TRUE",
    "FALSE",
  ];

  const areEqual = types.some(type => {
    if (left.type === type && right.type === type) {
      return left.value === right.value;
    }
    return false;
  });
  if (areEqual) return true;

  // fallback to comparison by reference
  return left === right;
};
