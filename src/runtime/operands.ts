import { AtlasValue } from "./AtlasValue";

export const areEqualValues = (
  left: AtlasValue,
  right: AtlasValue
): boolean => {
  if (left.type === "Null" && right.type === "Null")
    return left.value === right.value;
  if (left.type === "String" && right.type === "String")
    return left.value === right.value;
  if (left.type === "Number" && right.type === "Number")
    return left.value === right.value;
  if (left.type === "Boolean" && right.type === "Boolean")
    return left.value === right.value;

  // fallback to comparison by reference
  return left === right;
};
