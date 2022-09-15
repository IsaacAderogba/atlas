import { AtlasCallable } from "./AtlasCallable";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, AtlasObjectProps } from "./AtlasObject";
import { Interpreter } from "../runtime/Interpreter";
import { Token } from "../ast/Token";
import { RuntimeErrors } from "../errors/RuntimeError";

export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "Class";
  name: string;

  constructor(name: string, properties: AtlasObjectProps = {}) {
    super({ ...properties });

    this.name = name;
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  bind(): AtlasClass {
    return this;
  }

  set(name: Token): void {
    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = new AtlasInstance(this, new Map(this.fields));
    return (
      this.findMethod("init")?.bind(instance).call(interpreter, args) ??
      instance
    );
  }

  findMethod(name: string): (AtlasCallable & AtlasValue) | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
  }
}
