import { FunctionStmt } from "../ast/Stmt";
import { AtlasCallable } from "./AtlasCallable";
import { AtlasNull } from "./AtlasNull";
import { AtlasValue } from "./AtlasValue";
import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasFunction implements AtlasCallable {
  readonly type = "FUNCTION";
  static readonly atlasClassName = "Function";

  constructor(private readonly declaration: FunctionStmt) {}

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const environment = new Environment(interpreter.globals);

    for (const [i, param] of this.declaration.params.entries()) {
      environment.define(param.name.lexeme, args[i]);
    }

    interpreter.executeBlock(this.declaration.body.statements, environment);
    return new AtlasNull();
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

interface AtlasFunction extends NativeTypeMixin {}
applyMixin(AtlasFunction, NativeTypeMixin);

export { AtlasFunction };
