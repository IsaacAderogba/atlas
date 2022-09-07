import { AtlasObject } from "./AtlasObject";

export class AtlasNumber extends AtlasObject {
  readonly type = "NUMBER";

  constructor(readonly value: number) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}
