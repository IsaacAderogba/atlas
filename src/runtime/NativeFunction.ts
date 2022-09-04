import { AtlasCallable } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class NativeFunction implements AtlasCallable {
  readonly type = "NATIVE_FUNCTION";
  static readonly loxClassName = "Function";

  constructor(
    private readonly jsFunction: (...args: AtlasValue[]) => AtlasValue
  ) {}

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

interface NativeFunction extends NativeTypeMixin {}
applyMixin(NativeFunction, NativeTypeMixin);

export { NativeFunction };
