import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { AtlasType } from "../primitives/AtlasType";
import { Interpreter } from "../runtime/Interpreter";

export interface AtlasCallable {
  arity(): number;
  bind(instance: AtlasObject): AtlasCallable & AtlasValue;
  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue;
}

export const isCallable = (
  value: AtlasValue
): value is AtlasCallable & AtlasValue => {
  return (
    value.type === "Function" ||
    value.type === "NativeFn" ||
    value.type === "Class"
  );
};

export interface CallableType {
  arity(): number;
  params: AtlasType[];
  returns: AtlasType;
}

export const isCallableType = (
  value: AtlasType
): value is CallableType & AtlasType =>
  value.type === "Function" ||
  value.type === "NativeFn" ||
  value.type === "Class";
