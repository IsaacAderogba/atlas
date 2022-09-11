import { AtlasObject } from "./AtlasObject";

export class AtlasTrue extends AtlasObject {
  readonly type = "TRUE";

  constructor(readonly value: true = true) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}
