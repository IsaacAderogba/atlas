import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";
import { isCallableType } from "./AtlasCallable";

export type ObjectTypeProps = { [key: string]: AtlasType };

export abstract class ObjectType {
  abstract type: string;
  abstract toString(): string;
  abstract isSubtype(candidate: AtlasType): boolean;

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

export class AnyType extends ObjectType {
  readonly type = "Any";

  isSubtype(_candidate: AtlasType): boolean {
    return true;
  }

  static init = (): AnyType => new AnyType();
  init: typeof AnyType.init = () => AnyType.init();

  toString = (): string => "any";
}

export const isAnyType = (type: AtlasType): type is AnyType =>
  type.type === "Any";

export class BooleanType extends ObjectType {
  readonly type = "Boolean";

  isSubtype(candidate: AtlasType): boolean {
    return isAnyType(candidate) || isBooleanType(candidate);
  }

  static init = (): BooleanType => new BooleanType();
  init: typeof BooleanType.init = () => BooleanType.init();

  toString = (): string => "boolean";
}

export const isBooleanType = (type: AtlasType): type is BooleanType =>
  type.type === "Boolean";

export class NumberType extends ObjectType {
  readonly type = "Number";

  isSubtype(candidate: AtlasType): boolean {
    return isAnyType(candidate) || isNumberType(candidate);
  }

  static init = (): NumberType => new NumberType();
  init: typeof NumberType.init = () => NumberType.init();

  toString = (): string => "number";
}

export const isNumberType = (type: AtlasType): type is NumberType =>
  type.type === "Number";

export class StringType extends ObjectType {
  readonly type = "String";

  isSubtype(candidate: AtlasType): boolean {
    return isAnyType(candidate) || isStringType(candidate);
  }

  static init = (): StringType => new StringType();
  init: typeof StringType.init = () => StringType.init();

  toString = (): string => "string";
}

export const isStringType = (type: AtlasType): type is StringType =>
  type.type === "String";

export class NullType extends ObjectType {
  readonly type = "Null";

  isSubtype(candidate: AtlasType): boolean {
    return isAnyType(candidate) || isNullType(candidate);
  }

  static init = (): NullType => new NullType();
  init: typeof NullType.init = () => NullType.init();

  toString = (): string => "null";
}

export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(readonly properties: { name: string; type: AtlasType }[]) {
    super();
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!(candidate instanceof RecordType)) return false;

    return candidate.properties.every(({ name, type }) => {
      const compare = this.properties.find(prop => prop.name === name);
      if (compare) return compare.type.isSubtype(type);
      return false;
    });
  }

  toString = (): string => {
    const props = this.properties.map(
      ({ name, type }) => `${name}: ${type.toString()}`
    );

    return `{ ${props.join(", ")} }`;
  };

  static init = (
    properties:
      | { name: string; type: AtlasType }[]
      | { [name: string]: AtlasType }
  ): RecordType => {
    if (Array.isArray(properties)) return new RecordType(properties);

    return this.init(
      Object.entries(properties).map(([name, type]) => ({ name, type }))
    );
  };

  init: typeof RecordType.init = (...props) => RecordType.init(...props);
}

function propType(type: RecordType, name: string): AtlasType | undefined {
  const prop = type.properties.find(({ name: propName }) => propName === name);
  return prop?.type;
}

export const isRecordType = (type: AtlasType): type is RecordType =>
  type.type === "Record";

export type AtlasType =
  | AnyType
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType;

export default {
  Any: AnyType.init(),
  Null: NullType.init(),
  Boolean: BooleanType.init(),
  Number: NumberType.init(),
  String: StringType.init(),
  Record: RecordType.init({}),
};
