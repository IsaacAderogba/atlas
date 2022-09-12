import { AtlasNull } from "./AtlasNull";
import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { toNativeFunctions } from "./AtlasNativeFn";
import { AtlasString } from "./AtlasString";
import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";

export class AtlasRecord extends AtlasObject {
  readonly type = "Record";

  constructor(readonly entries: Map<AtlasString, AtlasValue> = new Map()) {
    super(
      toNativeFunctions({
        add: AtlasRecord.prototype.add,
        remove: AtlasRecord.prototype.remove,
      })
    );
  }

  add(key: AtlasValue, value: AtlasValue): AtlasValue {
    if (key.type !== "String") {
      throw new NativeError(RuntimeErrors.expectedString());
    }

    this.entries.set(key, value);
    return value;
  }

  remove(key: AtlasValue): AtlasValue {
    if (key.type !== "String") {
      throw new NativeError(RuntimeErrors.expectedString());
    }

    const value = this.entries.get(key) || new AtlasNull();
    this.entries.delete(key);
    return value;
  }

  toString(): string {
    console.log(this.entries);
    return "record";
  }
}
