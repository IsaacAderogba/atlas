import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";

export type ObjectTypeProps = { [key: string]: AtlasType };

export abstract class ObjectType {
  abstract type: string;
  abstract toString(): string;
  abstract isSubtype(candidate: AtlasType): boolean;

  fields = new Map<string, AtlasType>();

  constructor(properties: ObjectTypeProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      this.fields.set(name, value);
    }
  }

  get(name: Token): AtlasType | undefined {
    return this.fields.get(name.lexeme);
  }

  set(name: Token, value: AtlasType): void {
    this.fields.set(name.lexeme, value);
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

  toString = (): string => this.type;
}

export const isAnyType = (value: unknown): value is AnyType =>
  value instanceof AnyType;

export class BooleanType extends ObjectType {
  readonly type = "Boolean";

  isSubtype(candidate: AtlasType): boolean {
    return isAnyType(candidate) || isBooleanType(candidate);
  }

  static init = (): BooleanType => new BooleanType();
  init: typeof BooleanType.init = () => BooleanType.init();

  toString = (): string => this.type;
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

  toString = (): string => this.type;
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

  toString = (): string => this.type;
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

  toString = (): string => this.type;
}

export const isNullType = (type: AtlasType): type is NullType =>
  type.type === "Null";

export class RecordType extends ObjectType {
  readonly type = "Record";

  constructor(entries: { [key: string]: AtlasType } = {}) {
    super(entries);
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!(candidate instanceof RecordType)) return false;

    return [...candidate.fields.entries()].every(([name, type]) => {
      const compare = this.fields.get(name);
      if (compare) return compare.isSubtype(type);
      return false;
    });
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

interface CallableTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}
export abstract class CallableType extends ObjectType {
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: CallableTypeProps) {
    super();

    this.params = props.params;
    this.returns = props.returns;
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!(candidate instanceof CallableType)) return false;
    if (this.arity() !== candidate.arity()) return false;
    if (!this.returns.isSubtype(candidate.returns)) return false;
    return this.params.every((a, i) => candidate.params[i].isSubtype(a));
  }

  arity(): number {
    return this.params.length;
  }
}

export const isCallableType = (value: unknown): value is CallableType =>
  value instanceof CallableType;

export class FunctionType extends CallableType {
  readonly type = "Function";

  constructor(props: CallableTypeProps) {
    super(props);
  }

  static init = (props: CallableTypeProps): FunctionType =>
    new FunctionType(props);

  init: typeof FunctionType.init = (...props) => FunctionType.init(...props);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}

export class NativeFnType extends CallableType {
  readonly type = "NativeFn";

  constructor(props: CallableTypeProps) {
    super(props);
  }

  static init = (props: CallableTypeProps): NativeFnType =>
    new NativeFnType(props);

  init: typeof NativeFnType.init = (...props) => NativeFnType.init(...props);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}

export type AtlasType =
  | AnyType
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType
  | FunctionType
  | NativeFnType;

export const Types = {
  Any: AnyType.init(),
  Null: NullType.init(),
  Boolean: BooleanType.init(),
  Number: NumberType.init(),
  String: StringType.init(),
  Record: RecordType.init({}),
  Function: FunctionType.init({ params: [], returns: NullType.init() }),
  NativeFn: NativeFnType.init({ params: [], returns: NullType.init() }),
} as const;
