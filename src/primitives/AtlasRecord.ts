import { AtlasObject } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";

export class AtlasRecord extends AtlasObject {
  readonly type = "Record";

  constructor(entries: { [key: string]: AtlasValue } = {}) {
    super(entries);
  }

  toString(): string {
    console.log(this.fields);
    return "record";
  }
}
