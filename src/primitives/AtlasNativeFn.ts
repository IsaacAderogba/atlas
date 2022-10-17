import { AtlasCallable, CallableType } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap, GenericVisitedMap } from "../typechecker/GenericUtils";

type NativeFunction = (
  interpreter: Interpreter,
  ...args: AtlasValue[]
) => AtlasValue;
export class AtlasNativeFn extends AtlasObject implements AtlasCallable {
  readonly type = "NativeFn";

  constructor(public readonly func: NativeFunction) {
    super();
  }

  arity(): number {
    if (this.func.length === 0) return 0;
    return this.func.length - 1; // to ignore the implicit interpreter arg
  }

  bind(instance: AtlasValue): AtlasNativeFn {
    return new AtlasNativeFn(this.func.bind(instance));
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    return this.func(interpreter, ...args);
  }

  toString(): string {
    return "<native fn>";
  }
}

export const atlasNativeFn = (func: NativeFunction): AtlasNativeFn =>
  new AtlasNativeFn(func);

type ConvertedFunctions = { [key: string]: AtlasCallable & AtlasValue };

export const toNativeFunctions = (funcs: {
  [name: string]: AtlasNativeFn["func"];
}): ConvertedFunctions => {
  const convertedFuncs: ConvertedFunctions = {};

  for (const [name, func] of Object.entries(funcs)) {
    convertedFuncs[name] = atlasNativeFn(func);
  }

  return convertedFuncs;
};

interface NativeFnTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}

export class NativeFnType extends ObjectType implements CallableType {
  readonly type = "NativeFn";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: NativeFnTypeProps, generics: AtlasType[] = []) {
    super({}, generics);
    this.params = props.params;
    this.returns = props.returns;
  }

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): AtlasType {
    const params = this.params.map(param =>
      param.bindGenerics(genericTypeMap, visited)
    );
    const returns = this.returns.bindGenerics(genericTypeMap, visited);
    return this.init({ params, returns }, this.generics);
  }

  arity(): number {
    return this.params.length;
  }

  init = (props: NativeFnTypeProps, generics: AtlasType[] = []): NativeFnType =>
    new NativeFnType(props, generics);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}
