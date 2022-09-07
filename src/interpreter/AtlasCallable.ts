import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";

export interface AtlasCallable {
  arity(): number;
  bind(instance: AtlasValue): AtlasCallable & AtlasValue;
  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue;
}
