import { AtlasNull } from "./AtlasNull";
import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { toNativeFunctions } from "./AtlasNativeFn";

export class AtlasList extends AtlasObject {
  readonly type = "LIST";

  constructor(readonly items: AtlasValue[] = []) {
    super(
      toNativeFunctions({
        add: AtlasList.prototype.add,
        remove: AtlasList.prototype.remove,
      })
    );
  }

  add(item: AtlasValue): AtlasValue {
    this.items.push(item);
    return item;
  }

  remove(): AtlasValue {
    const value = this.items.pop();
    return value || new AtlasNull();
  }

  toString(): string {
    return `[${this.items.join(", ")}]`;
  }
}
