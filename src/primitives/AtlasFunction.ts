import { FunctionExpr } from "../ast/Expr";
import { AtlasCallable } from "./AtlasCallable";
import { AtlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { Environment } from "../runtime/Environment";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasObject } from "./AtlasObject";
import { Return } from "../runtime/Throws";

export class AtlasFunction extends AtlasObject implements AtlasCallable {
  readonly type = "FUNCTION";

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

    if (this.isInitializer) return this.closure.getAt("this", 0);
    return new AtlasNull();
  }

  toString(): string {
    return `<fn>`;
  }
}
