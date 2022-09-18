import { FunctionExpr } from "../ast/Expr";
import { AtlasCallable, CallableType } from "./AtlasCallable";
import { AtlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { Environment } from "../runtime/Environment";
import { Interpreter } from "../runtime/Interpreter";
import { Return } from "../runtime/Throws";
import { AtlasType } from "./AtlasType";

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
    const execute = (): AtlasValue => {
      const environment = new Environment(this.closure);

      for (const [i, param] of this.expression.params.entries()) {
        environment.define(param.name.lexeme, args[i]);
      }

      try {
        interpreter.interpretBlock(
          this.expression.body.statements,
          environment
        );
      } catch (err) {
        if (err instanceof Return) return err.value;
        throw err;
      }

      if (this.isInitializer) return this.closure.getAt("this", 0);
      return new AtlasNull();
    };

    if (this.expression.async) {
      interpreter.scheduler.queueTask(() => execute());
      return new AtlasNull();
    }

    return execute();
  }

  toString(): string {
    return `<fn>`;
  }
}

interface FunctionTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}
export class FunctionType extends ObjectType implements CallableType {
  readonly type = "Function";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: FunctionTypeProps) {
    super();
    this.params = props.params;
    this.returns = props.returns;
  }

  arity(): number {
    return this.params.length;
  }

  static init = (props: FunctionTypeProps): FunctionType =>
    new FunctionType(props);

  init: typeof FunctionType.init = (...props) => FunctionType.init(...props);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}
