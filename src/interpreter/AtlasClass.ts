import { AtlasCallable } from "./AtlasCallable";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { NativeType } from "./NativeType";

export class AtlasClass extends NativeType implements AtlasCallable {
  readonly type = "CLASS";
  static readonly atlasClassName = "Class";

  constructor(readonly name: string) {
    super();
  }

  arity(): number {
    return 0;
  }

  call(): AtlasValue {
    const instance = new AtlasInstance(this);
    return instance;
  }

  toString(): string {
    return this.name;
  }
}
