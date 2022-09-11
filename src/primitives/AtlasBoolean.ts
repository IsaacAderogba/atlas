import { AtlasObject } from "./AtlasObject";

export class AtlasBoolean extends AtlasObject {
  readonly type = "Boolean";

  constructor(readonly value: true | false) {
    super({});
  }

  toString(): string {
    return String(this.value);
  }
}

export const atlasBoolean = (value: true | false): AtlasBoolean =>
  new AtlasBoolean(value);
