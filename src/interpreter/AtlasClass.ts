import { AtlasCallable } from "./AtlasCallable";
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
    throw new Error("");
  }

  toString(): string {
    return this.name;
  }
}
