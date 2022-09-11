import { AtlasObject } from "./AtlasObject";

export class AtlasNumber extends AtlasObject {
  readonly type = "Number";

  constructor(readonly value: number) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}
