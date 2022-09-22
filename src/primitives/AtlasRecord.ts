import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { isCallableType } from "./AtlasCallable";
import { toNativeFunctions } from "./AtlasNativeFn";
import { AtlasNull } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { isAtlasString } from "./AtlasString";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { bindInterfaceGenerics, toInterfaceString } from "./InterfaceType";

export class AtlasRecord extends AtlasObject {
  readonly type = "Record";

  constructor(readonly entries: { [key: string]: AtlasValue } = {}) {
    super(
      toNativeFunctions({
        put: AtlasRecord.prototype.put,
        remove: AtlasRecord.prototype.remove,
      })
    );
  }

  put(key: AtlasValue, value: AtlasValue): AtlasValue {
    if (!isAtlasString(key)) {
      throw new NativeError(RuntimeErrors.expectedString());
    }

    this.entries[key.value] = value;
    return value;
  }

  remove(key: AtlasValue): AtlasValue {
    if (!isAtlasString(key)) {
      throw new NativeError(RuntimeErrors.expectedString());
    }

    const entry = this.entries[key.value];
    if (entry) {
      delete this.entries[key.value];
      return entry;
    }

    return new AtlasNull();
  }

  toString(): string {
    return "record";
  }
}

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(readonly entries: { [key: string]: AtlasType } = {}) {
    super();
  }

  get fields(): ObjectType["fields"] {
    const map: ObjectType["fields"] = new Map();

    Object.entries(this.entries).forEach(([key, value]) => {
      if (!isCallableType(value)) map.set(key, value);
    });

    return map;
  }

  get methods(): ObjectType["methods"] {
    const map: ObjectType["methods"] = new Map();

    Object.entries(this.entries).forEach(([key, value]) => {
      if (isCallableType(value)) map.set(key, value);
    });

    return map;
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const { entries } = bindInterfaceGenerics(this, genericTypeMap);
    return this.init(entries);
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
