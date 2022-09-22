import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { NativeFnType, toNativeFunctions } from "./AtlasNativeFn";
import { AtlasNull, NullType } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { isAtlasString, StringType } from "./AtlasString";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { GenericType } from "./GenericType";
import { UnionType } from "./UnionType";

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

  constructor(readonly itemType: AtlasType) {
    super(
      {
        put: new NativeFnType({
          params: [new StringType(), itemType],
          returns: itemType,
        }),
        remove: new NativeFnType({
          params: [],
          returns: new UnionType([itemType, new NullType()]),
        }),
      },
      [new GenericType("T")]
    );
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const mappedItem = genericTypeMap.get(this.generics[0])!;
    const itemType = mappedItem.bindGenerics(genericTypeMap);
    return this.init(itemType);
  }

  init = (itemType: AtlasType): RecordType => {
    return new RecordType(itemType);
  };

  toString = (): string => `{ String: ${this.itemType.toString()} }`;
}

export const isRecordType = (type: AtlasType): type is RecordType =>
  type.type === "Record";
