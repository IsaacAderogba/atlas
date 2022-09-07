import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";

export interface AtlasCallable {
  arity(): number;
  bind(instance: AtlasObject): AtlasCallable & AtlasValue;
  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue;
}
