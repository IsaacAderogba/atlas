import { FunctionExpr } from "../ast/Expr";
import {
  AtlasCallable,
  bindCallableGenerics,
  CallableType,
} from "./AtlasCallable";
import { atlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { Environment } from "../runtime/Environment";
import { Interpreter } from "../runtime/Interpreter";
import { Return } from "../runtime/Throws";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";

export class AtlasFunction extends AtlasObject implements AtlasCallable {
  readonly type = "Function";

  constructor(
    private readonly expression: FunctionExpr,
    private readonly closure: Environment,
    private readonly isInitializer: boolean
  ) {
    super({});
  }

  arity(): number {
    return this.expression.params.length;
  }

  bind(instance: AtlasValue): AtlasFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new AtlasFunction(this.expression, environment, this.isInitializer);
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const environment = new Environment(this.closure);

    for (const [i, param] of this.expression.params.entries()) {
      environment.define(param.name.lexeme, args[i]);
    }

    try {
      interpreter.interpretBlock(this.expression.body.statements, environment);
    } catch (err) {
      if (err instanceof Return) return err.value;
      throw err;
    }

    if (this.isInitializer) {
      return this.closure.get("this", this.expression.keyword);
    }

    return atlasNull;
  }

  toString(): string {
    return `<fn>`;
  }
}

export const isAtlasFunction = (type?: AtlasValue): type is AtlasFunction =>
  type?.type === "Function";

export const atlasFunction = (
  expression: FunctionExpr,
  closure: Environment,
  isInitializer: boolean
): AtlasFunction => new AtlasFunction(expression, closure, isInitializer);

interface FunctionTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}
export class FunctionType extends ObjectType implements CallableType {
  readonly type = "Function";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: FunctionTypeProps, generics: AtlasType[] = []) {
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

  init = (props: FunctionTypeProps, generics: AtlasType[] = []): FunctionType =>
    new FunctionType(props, generics);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}
