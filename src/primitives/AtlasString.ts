import { AtlasObject } from "./AtlasObject";

export class AtlasString extends AtlasObject {
  readonly type = "STRING";

  constructor(readonly value: string) {
    super({});
  }

  toString(): string {
    return this.value;
  }
}
