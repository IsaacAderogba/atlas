import { AtlasCallable } from "./AtlasCallable";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, AtlasObjectProps } from "./AtlasObject";
import { Interpreter } from "./Interpreter";

export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "CLASS";

  constructor(readonly name: string, properties: AtlasObjectProps = {}) {
    super({ ...properties });
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  bind(): AtlasClass {
    return this;
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = new AtlasInstance(this, this.fields);
    this.findMethod("init")?.bind(instance).call(interpreter, args);
    return instance;
  }

  findMethod(name: string): (AtlasCallable & AtlasValue) | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
  }
}
