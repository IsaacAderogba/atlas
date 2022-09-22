import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { toNativeFunctions } from "./AtlasNativeFn";
import { AtlasNull } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { isAtlasString } from "./AtlasString";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { bindInterfaceGenerics, toInterfaceString } from "./InterfaceType";

export class AtlasRecord extends AtlasObject {
  readonly type = "Record";

  constructor(entries: { [key: string]: AtlasValue } = {}) {
    super({
      ...entries,
      ...toNativeFunctions({
        put: AtlasRecord.prototype.put,
        // remove: AtlasRecord.prototype.remove,
      }),
    });
  }

  put(key: AtlasValue, value: AtlasValue): AtlasValue {
    if (!isAtlasString(key)) {
      throw new NativeError(RuntimeErrors.expectedString());
    }
    super.set(key.value, value);
    return value;
  }

  // remove(name: AtlasValue): AtlasValue {
  //   const field = this.fields.get(name.lexeme);

  //   if (field) {
  //     this.fields.delete(name.lexeme);
  //     return field;
  //   }

  //   const method = this.methods.get(name.lexeme);

  //   if (method) {
  //     this.methods.delete(name.lexeme);
  //     return method;
  //   }

  //   return new AtlasNull();
  // }

  toString(): string {
    return "record";
  }
}

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(entries: { [key: string]: AtlasType } = {}) {
    super(entries);
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
