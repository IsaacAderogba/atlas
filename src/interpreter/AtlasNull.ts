import { AtlasObject } from "./AtlasObject";
import { AtlasString } from "./AtlasString";
import { toNativeFunctions } from "./NativeFunction";

export class AtlasNull extends AtlasObject {
  readonly type = "NULL";

  constructor(readonly value: null = null) {
    super({
      ...toNativeFunctions({
        toString: () => new AtlasString(this.toString()),
      }),
    });
  }

  toString(): string {
    return String(this.value);
  }
}
