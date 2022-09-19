import { AtlasCallable, bindCallableGenerics, CallableType } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasType } from "./AtlasType";
import { GenericType } from "./GenericType";
import { GenericTypeMap } from "../typechecker/GenericUtils";

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

interface NativeFnTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}

export class NativeFnType extends ObjectType implements CallableType {
  readonly type = "NativeFn";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: NativeFnTypeProps, generics: GenericType[] = []) {
    super({}, generics);
    this.params = props.params;
    this.returns = props.returns;
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const { params, returns } = bindCallableGenerics(this, genericTypeMap);
    return this.init({ params, returns }, this.generics);
  }

  arity(): number {
    return this.params.length;
  }

  init = (
    props: NativeFnTypeProps,
    generics: GenericType[] = []
  ): NativeFnType => new NativeFnType(props, generics);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}
