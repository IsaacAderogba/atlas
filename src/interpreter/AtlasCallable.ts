import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";

export interface AtlasCallable {
  arity(): number;
  bind(instance: AtlasObject): AtlasCallable & AtlasValue;
  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue;
}

export const isCallable = (
  value: AtlasValue
): value is AtlasCallable & AtlasValue => {
  return (
    value.type === "FUNCTION" ||
    value.type === "NATIVE_FUNCTION" ||
    value.type === "CLASS"
  );
};
