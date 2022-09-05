import { AtlasValue } from "./AtlasValue";

export const areEqualValues = (
  left: AtlasValue,
  right: AtlasValue
): boolean => {
  if (left.type === "NULL" && right.type === "NULL")
    return left.value === right.value;
  if (left.type === "STRING" && right.type === "STRING")
    return left.value === right.value;
  if (left.type === "NUMBER" && right.type === "NUMBER")
    return left.value === right.value;
  if (left.type === "TRUE" && right.type === "TRUE")
    return left.value === right.value;
  if (left.type === "FALSE" && right.type === "FALSE")
    return left.value === right.value;

  // fallback to comparison by reference
  return left === right;
};
