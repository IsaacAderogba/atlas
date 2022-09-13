import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";
import { isCallableType } from "./AtlasCallable";

export type ObjectTypeProps = { [key: string]: AtlasType };

export abstract class ObjectType {
  abstract type: string;
  abstract toString(): string;
  methods = new Map<string, AtlasType>();
  fields = new Map<string, AtlasType>();

  constructor(properties: ObjectTypeProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      if (isCallableType(value)) {
        this.methods.set(name, value);
      } else {
        this.fields.set(name, value);
      }
    }
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): TypeCheckError {
    return new TypeCheckError(message, source.sourceRange());
  }
}

export class BooleanType extends ObjectType {
  readonly type = "Boolean";

  toString = (): string => "boolean";
}

export const booleanType = new BooleanType();
export const isBooleanType = (type: AtlasType): type is BooleanType =>
  type.type === "Boolean";

export class NumberType extends ObjectType {
  readonly type = "Number";

  toString = (): string => "number";
}

export const numberType = new NumberType();
export const isNumberType = (type: AtlasType): type is NumberType =>
  type.type === "Number";

export class StringType extends ObjectType {
  readonly type = "String";

  toString = (): string => "string";
}

export const stringType = new StringType();
export const isStringType = (type: AtlasType): type is StringType =>
  type.type === "String";

export class NullType extends ObjectType {
  readonly type = "Null";

  toString = (): string => "null";
}

export const nullType = new NullType();
export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(readonly properties: { name: string; type: AtlasType }[]) {
    super();
  }

  toString = (): string => {
    const props = this.properties.map(
      ({ name, type }) => `${name}: ${type.toString()}`
    );

    return `{ ${props.join(", ")} }`;
  };
}

export const recordType = (
  properties:
    | { name: string; type: AtlasType }[]
    | { [name: string]: AtlasType }
): RecordType => {
  if (Array.isArray(properties)) return new RecordType(properties);

  return recordType(
    Object.entries(properties).map(([name, type]) => ({ name, type }))
  );
};

export const isRecordType = (type: AtlasType): type is RecordType =>
  type.type === "Record";

export type AtlasType =
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType;

export default {
  Null: nullType,
  Boolean: booleanType,
  Number: numberType,
  Record: recordType,
  String: stringType,

  isNull: isNullType,
  isBoolean: isBooleanType,
  isNumber: isNumberType,
  isString: isStringType,
  isRecord: isRecordType,
};
