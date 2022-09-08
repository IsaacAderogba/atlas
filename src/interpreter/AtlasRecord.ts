import { AtlasNull } from "./AtlasNull";
import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { toNativeFunctions } from "./NativeFunction";

export class AtlasRecord extends AtlasObject {
  readonly type = "RECORD";

  constructor(readonly entries: Map<AtlasValue, AtlasValue> = new Map()) {
    super(
      toNativeFunctions({
        add: AtlasRecord.prototype.add,
        remove: AtlasRecord.prototype.remove,
      })
    );
  }

  add(key: AtlasValue, value: AtlasValue): AtlasValue {
    this.entries.set(key, value);
    return value;
  }

  remove(key: AtlasValue): AtlasValue {
    const value = this.entries.get(key) || new AtlasNull();
    this.entries.delete(key);
    return value;
  }

  toString(): string {
    console.log(this.entries);
    return "record";
  }
}
