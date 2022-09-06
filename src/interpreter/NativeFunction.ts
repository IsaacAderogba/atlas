import { AtlasCallable } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";
import { NativeType } from "./NativeType";

export class NativeFunction extends NativeType implements AtlasCallable {
  readonly type = "NATIVE_FUNCTION";
  readonly className = "NativeFunction";

  constructor(
    private readonly jsFunction: (...args: AtlasValue[]) => AtlasValue
  ) {
    super();
  }

  arity(): number {
    return this.jsFunction.length;
  }

  call(_: Interpreter, args: AtlasValue[]): AtlasValue {
    return this.jsFunction(...args);
  }

  toString(): string {
    return "<native fn>";
  }
}
