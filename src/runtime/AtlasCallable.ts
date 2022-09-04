import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";

export interface AtlasCallable {
  arity(): number;
  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue;
}
