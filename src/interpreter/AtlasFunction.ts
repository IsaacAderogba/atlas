import { FunctionExpr } from "../ast/Expr";
import { AtlasCallable } from "./AtlasCallable";
import { AtlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";
import { Return } from "./Throws";

class AtlasFunction implements AtlasCallable {
  readonly type = "FUNCTION";
  static readonly atlasClassName = "Function";

  constructor(
    private readonly expression: FunctionExpr,
    private readonly closure: Environment
  ) {}

  arity(): number {
    return this.expression.params.length;
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

interface AtlasFunction extends NativeTypeMixin {}
applyMixin(AtlasFunction, NativeTypeMixin);

export { AtlasFunction };
