import { AtlasCallable } from "./AtlasCallable";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject } from "./AtlasObject";

type Method = AtlasCallable & AtlasValue;
export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "CLASS";
  readonly methods = new Map<string, Method>();
  readonly fields = new Map<string, AtlasValue>();

  constructor(
    readonly name: string,
    properties = new Map<string, AtlasValue>()
  ) {
    super();

    for (const [name, value] of properties) {
      if (value.type === "FUNCTION" || value.type === "NATIVE_FUNCTION") {
        this.methods.set(name, value);
      } else {
        this.fields.set(name, value);
      }
    }
  }

  arity(): number {
    return 0;
  }

  bind(): AtlasClass {
    return this;
  }

  call(): AtlasValue {
    const instance = new AtlasInstance(this, this.fields);
    return instance;
  }

  findMethod(name: string): Method | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
  }
}
