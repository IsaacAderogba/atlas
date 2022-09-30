import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { NativeFnType, toNativeFunctions } from "./AtlasNativeFn";
import { AtlasNull, NullType } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { isAtlasString, StringType } from "./AtlasString";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { GenericType, isGenericType } from "./GenericType";
import { UnionType } from "./UnionType";

export class AtlasRecord extends AtlasObject {
  readonly type = "Record";

  constructor(readonly entries: { [key: string]: AtlasValue } = {}) {
    super(
      toNativeFunctions({
        add: AtlasRecord.prototype.add,
        at: AtlasRecord.prototype.at,
        remove: AtlasRecord.prototype.remove,
      })
    );
  }

  at(key: AtlasValue): AtlasValue {
    if (!isAtlasString(key)) {
      throw new NativeError(RuntimeErrors.expectedString());
    }

    return this.entries[key.value] ?? new AtlasNull();
  }

  add(key: AtlasValue, value: AtlasValue): AtlasValue {
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

  constructor(readonly itemType: AtlasType = new GenericType("T")) {
    const generics = isGenericType(itemType) ? [itemType] : []
    super(
      {
        add: new NativeFnType({
          params: [new StringType(), itemType],
          returns: itemType,
        }),
        at: new NativeFnType({
          params: [new StringType()],
          returns: new UnionType([itemType, new NullType()]),
        }),
        remove: new NativeFnType({
          params: [new StringType()],
          returns: new UnionType([itemType, new NullType()]),
        }),
      },
      generics
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
