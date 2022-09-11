import { AtlasObject } from "./AtlasObject";

export class AtlasNull extends AtlasObject {
  readonly type = "Null";

  constructor(readonly value: null = null) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}
