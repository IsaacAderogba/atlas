export class BooleanType {
  readonly type = "Boolean";

  toString = (): string => "boolean";
}

export const booleanType = new BooleanType();
export const isBooleanType = (type: Type): type is BooleanType =>
  type.type === "Boolean";

export class NumberType {
  readonly type = "Number";

  toString = (): string => "number";
}

export const numberType = new NumberType();
export const isNumberType = (type: Type): type is NumberType =>
  type.type === "Number";

export class StringType {
  readonly type = "String";

  toString = (): string => "string";
}

export const stringType = new StringType();
export const isStringType = (type: Type): type is StringType =>
  type.type === "String";

export class NullType {
  readonly type = "Null";

  toString = (): string => "null";
}

export const nullType = new NullType();
export const isNullType = (type: Type): type is NullType =>
  type.type === "Null";

export class RecordType {
  readonly type = "Record";

  constructor(readonly properties: { name: string; type: Type }[]) {}

  toString = (): string => {
    const props = this.properties.map(
      ({ name, type }) => `${name}: ${type.toString()}`
    );

    return `{ ${props.join(", ")} }`;
  };
}

export const recordType = (
  properties: { name: string; type: Type }[] | { [name: string]: Type }
): RecordType => {
  if (Array.isArray(properties)) return new RecordType(properties);

  return recordType(
    Object.entries(properties).map(([name, type]) => ({ name, type }))
  );
};

export const isRecordType = (type: Type): type is RecordType =>
  type.type === "Record";

export type Type =
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
