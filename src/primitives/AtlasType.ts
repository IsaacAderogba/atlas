export class BooleanType {
  readonly type = "Boolean";

  toString = (): string => "boolean";
}

export const booleanType = new BooleanType();
export const isBooleanType = (type: AtlasType): type is BooleanType =>
  type.type === "Boolean";

export class NumberType {
  readonly type = "Number";

  toString = (): string => "number";
}

export const numberType = new NumberType();
export const isNumberType = (type: AtlasType): type is NumberType =>
  type.type === "Number";

export class StringType {
  readonly type = "String";

  toString = (): string => "string";
}

export const stringType = new StringType();
export const isStringType = (type: AtlasType): type is StringType =>
  type.type === "String";

export class NullType {
  readonly type = "Null";

  toString = (): string => "null";
}

export const nullType = new NullType();
export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";

export class RecordType {
  readonly type = "Record";

  constructor(readonly properties: { name: string; type: AtlasType }[]) {}

  toString = (): string => {
    const props = this.properties.map(
      ({ name, type }) => `${name}: ${type.toString()}`
    );

    return `{ ${props.join(", ")} }`;
  };
}

export const recordType = (
  properties: { name: string; type: AtlasType }[] | { [name: string]: AtlasType }
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
