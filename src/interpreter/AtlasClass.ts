import { AtlasCallable } from "./AtlasCallable";
import { AtlasFunction } from "./AtlasFunction";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { NativeFunction } from "./NativeFunction";
import { NativeType } from "./NativeType";

type Method = AtlasFunction | NativeFunction;
export class AtlasClass extends NativeType implements AtlasCallable {
  readonly type = "CLASS";
  readonly methods = new Map<string, Method>();
  readonly fields = new Map<string, AtlasValue>();

  constructor(readonly name: string, properties = new Map<string, AtlasValue>()) {
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
