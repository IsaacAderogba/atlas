import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { toInterfaceString } from "./InterfaceType";

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

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(entries: { [key: string]: AtlasType } = {}) {
    super(entries);
  }

  init = (entries: { [key: string]: AtlasType } = {}): RecordType => {
    return new RecordType(entries);
  };

  toString = (): string => {
    return toInterfaceString(this);
  };
}

export const isRecordType = (type: AtlasType): type is RecordType =>
  type.type === "Record";
