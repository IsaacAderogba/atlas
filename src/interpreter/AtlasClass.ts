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
    return this.methods.get("init")?.arity() || 0;
  }

  bind(): AtlasClass {
    return this;
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = new AtlasInstance(this, this.fields);
    return (
      this.methods.get("init")?.bind(instance).call(interpreter, args) ??
      instance
    );
  }

  toString(): string {
    return this.name;
  }
}
