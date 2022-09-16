import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { isInterfaceSubtype } from "./InterfaceType";

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

  isSubtype(candidate: AtlasType): boolean {
    return isInterfaceSubtype(this, candidate);
  }

  static init = (entries: { [key: string]: AtlasType } = {}): RecordType => {
    return new RecordType(entries);
  };

  init: typeof RecordType.init = (...props) => RecordType.init(...props);

  toString = (): string => {
    const props: string[] = [];
    for (const [name, type] of this.fields.entries()) {
      props.push(`"${name}": ${type.toString()}`);
    }

    return `{ ${props.join(", ")} }`;
  };
}

export const isRecordType = (type: AtlasType): type is RecordType =>
  type.type === "Record";
