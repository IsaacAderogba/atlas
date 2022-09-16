import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { TypeCheckError } from "../errors/TypeCheckError";

export type ObjectTypeProps = { [key: string]: AtlasType };

export abstract class ObjectType {
  abstract type: string;
  abstract toString(): string;
  abstract isSubtype(candidate: AtlasType): boolean;

  fields = new Map<string, AtlasType>();
  methods = new Map<string, CallableType & AtlasType>();

  constructor(properties: ObjectTypeProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      this.setProp(name, value);
    }
  }

  setProp(name: string, value: AtlasType): void {
    if (isCallableType(value)) {
      this.methods.set(name, value);
    } else {
      this.fields.set(name, value);
    }
  }

  get(name: Token): AtlasType | undefined {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.methods.get(name.lexeme);
    if (method) return method;

    return undefined;
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

export interface CallableType {
  arity(): number;
  params: AtlasType[];
  returns: AtlasType;
}

export const isCallableType = (
  value: AtlasType
): value is CallableType & AtlasType =>
  value instanceof FunctionType ||
  value instanceof NativeFnType ||
  value instanceof ClassType;

interface FunctionTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}
export class FunctionType extends ObjectType implements CallableType {
  readonly type = "Function";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: FunctionTypeProps) {
    super();
    this.params = props.params;
    this.returns = props.returns;
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!isCallableType(candidate)) return false;
    if (this.arity() !== candidate.arity()) return false;
    if (!this.returns.isSubtype(candidate.returns)) return false;
    return this.params.every((a, i) => candidate.params[i].isSubtype(a));
  }

  arity(): number {
    return this.params.length;
  }

  static init = (props: FunctionTypeProps): FunctionType =>
    new FunctionType(props);

  init: typeof FunctionType.init = (...props) => FunctionType.init(...props);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}

interface NativeFnTypeProps {
  params: AtlasType[];
  returns: AtlasType;
}

export class NativeFnType extends ObjectType implements CallableType {
  readonly type = "NativeFn";
  public params: AtlasType[];
  public returns: AtlasType;

  constructor(props: NativeFnTypeProps) {
    super();
    this.params = props.params;
    this.returns = props.returns;
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!isCallableType(candidate)) return false;
    if (this.arity() !== candidate.arity()) return false;
    if (!this.returns.isSubtype(candidate.returns)) return false;
    return this.params.every((a, i) => candidate.params[i].isSubtype(a));
  }

  arity(): number {
    return this.params.length;
  }

  static init = (props: NativeFnTypeProps): NativeFnType =>
    new NativeFnType(props);

  init: typeof NativeFnType.init = (...props) => NativeFnType.init(...props);

  toString(): string {
    const args = this.params.map(p => p.toString());
    return `(${args.join(", ")}) -> ${this.returns.toString()}`;
  }
}

export class ClassType extends ObjectType implements CallableType {
  readonly type = "Class";

  constructor(public name: string, properties: ObjectTypeProps) {
    super({ ...properties });
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  get params(): AtlasType[] {
    return this.findMethod("init")?.params || [];
  }

  get returns(): AtlasType {
    return new InstanceType(this, new Map(this.fields));
  }

  findMethod(name: string): (CallableType & AtlasType) | undefined {
    return this.methods.get(name);
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (this === candidate) return true;
    return false;
  }

  static init = (name: string, properties: ObjectTypeProps = {}): ClassType =>
    new ClassType(name, properties);

  init: typeof ClassType.init = (...props) => ClassType.init(...props);

  toString(): string {
    // todo
    return this.name;
  }
}

export const isClassType = (type: unknown): type is ClassType =>
  type instanceof ClassType;

export class InstanceType extends ObjectType {
  readonly type = "Instance";

  constructor(
    readonly classType: ClassType,
    readonly fields: Map<string, AtlasType>
  ) {
    super();
  }

  get(name: Token): AtlasType | undefined {
    const field = this.fields.get(name.lexeme);
    if (field) return field;

    const method = this.classType.findMethod(name.lexeme);
    if (method) return method;

    return super.get(name);
  }

  isSubtype(candidate: AtlasType): boolean {
    if (isAnyType(candidate)) return true;
    if (!isInstanceType(candidate)) return false;
    if (this.classType === candidate.classType) return true;
    return false;
  }

  static init = (
    classType: ClassType,
    fields: Map<string, AtlasType>
  ): InstanceType => new InstanceType(classType, fields);

  init: typeof InstanceType.init = (...props) => InstanceType.init(...props);

  toString(): string {
    // todo
    return this.type;
  }
}

export const isInstanceType = (type: unknown): type is InstanceType =>
  type instanceof InstanceType;

export type AtlasType =
  | AnyType
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType
  | FunctionType
  | NativeFnType
  | ClassType
  | InstanceType;

export const Types = {
  Any: AnyType.init(),
  Null: NullType.init(),
  Boolean: BooleanType.init(),
  Number: NumberType.init(),
  String: StringType.init(),
  Record: RecordType.init({}),
  Function: FunctionType.init({ params: [], returns: NullType.init() }),
  NativeFn: NativeFnType.init({ params: [], returns: NullType.init() }),
  Class: ClassType.init("Class"),
  InstanceType: InstanceType.init(ClassType.init("Class"), new Map()),
} as const;
