import { AtlasCallable } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "./Interpreter";
import { AtlasObject } from "./AtlasObject";

export class NativeFunction extends AtlasObject implements AtlasCallable {
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

  bind(instance: AtlasValue): NativeFunction {
    return new NativeFunction(this.jsFunction.bind(instance));
  }

  call(_: Interpreter, args: AtlasValue[]): AtlasValue {
    return this.jsFunction(...args);
  }

  toString(): string {
    return "<native fn>";
  }
}
