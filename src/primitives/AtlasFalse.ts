import { AtlasObject } from "./AtlasObject";

export class AtlasFalse extends AtlasObject {
  readonly type = "FALSE";

  constructor(readonly value: false = false) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}
