import { AtlasObject } from "./AtlasObject";

export class AtlasString extends AtlasObject {
  readonly type = "String";

  constructor(readonly value: string) {
    super({});
  }

  toString(): string {
    return this.value;
  }
}

export const atlasString = (value: string): AtlasString =>
  new AtlasString(value);
