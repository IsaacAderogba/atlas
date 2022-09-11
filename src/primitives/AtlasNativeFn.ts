import { AtlasCallable } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasObject } from "./AtlasObject";

export class AtlasNativeFn extends AtlasObject implements AtlasCallable {
  readonly type = "NativeFn";

  constructor(
    private readonly jsFunction: (...args: AtlasValue[]) => AtlasValue
  ) {
    super();
  }

  arity(): number {
    return this.jsFunction.length;
  }

  bind(instance: AtlasValue): AtlasNativeFn {
    return new AtlasNativeFn(this.jsFunction.bind(instance));
  }

  call(_: Interpreter, args: AtlasValue[]): AtlasValue {
    return this.jsFunction(...args);
  }

  toString(): string {
    return "<native fn>";
  }
}

type ConvertedFunctions = { [key: string]: AtlasCallable & AtlasValue };

export const toNativeFunctions = (funcs: {
  [name: string]: AtlasNativeFn["jsFunction"];
}): ConvertedFunctions => {
  const convertedFuncs: ConvertedFunctions = {};

  for (const [name, func] of Object.entries(funcs)) {
    convertedFuncs[name] = new AtlasNativeFn(func);
  }

  return convertedFuncs;
};
