import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { AtlasType } from "../primitives/AtlasType";
import { Interpreter } from "../runtime/Interpreter";
import { isAnyType } from "./AnyType";

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

export const isCallableSubtype = (
  target: CallableType,
  candidate: AtlasType
): boolean => {
  if (isAnyType(candidate)) return true;
  if (!isCallableType(candidate)) return false;
  if (target.arity() !== candidate.arity()) return false;
  if (!target.returns.isSubtype(candidate.returns)) return false;
  return target.params.every((a, i) => candidate.params[i].isSubtype(a));
};
