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
