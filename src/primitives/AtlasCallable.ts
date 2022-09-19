import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { AtlasType } from "../primitives/AtlasType";
import { Interpreter } from "../runtime/Interpreter";
import { GenericTypeMap } from "../typechecker/GenericUtils";

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

export const bindCallableGenerics = (
  target: AtlasType,
  map: GenericTypeMap
): { params: AtlasType[]; returns: AtlasType } => {
  if (!isCallableType(target)) throw new Error("Invariant");

  const params = target.params.map(param => param.bindGenerics(map));
  const returns = target.returns.bindGenerics(map);

  return { params, returns };
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
