import { AtlasValue } from "./AtlasValue";
import { InterpreterError } from "./InterpreterError";

export const getNumberValue = (operand: AtlasValue): number => {
  if (operand.type === "NUMBER") return operand.value;
  throw new InterpreterError(`Operand ${operand.type} must be a number.`);
};

export const getBooleanValue = (operand: AtlasValue): boolean => {
  if (operand.type === "TRUE") return operand.value;
  if (operand.type === "FALSE") return operand.value;
  throw new InterpreterError(`Operand ${operand.type} must be a boolean.`);
};

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
