import { FunctionExpr } from "../ast/Expr";
import { AtlasCallable } from "./AtlasCallable";
import { AtlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { AtlasObject } from "./AtlasObject";
import { Return } from "./Throws";

export class AtlasFunction extends AtlasObject implements AtlasCallable {
  readonly type = "FUNCTION";

  constructor(
    private readonly expression: FunctionExpr,
    private readonly closure: Environment
  ) {
    super();
  }

  arity(): number {
    return this.expression.params.length;
  }

  bind(instance: AtlasValue): AtlasFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new AtlasFunction(this.expression, environment);
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

    return new AtlasNull();
  }

  toString(): string {
    return `<fn>`;
  }
}
