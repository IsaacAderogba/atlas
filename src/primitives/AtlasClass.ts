import { AtlasInstance, InstanceType } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, AtlasObjectProps, ObjectType, ObjectTypeProps } from "./AtlasObject";
import { Token } from "../ast/Token";
import { RuntimeErrors } from "../errors/RuntimeError";
import { AtlasCallable, CallableType } from "./AtlasCallable";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasType } from "./AtlasType";
import { isAnyType } from "./AnyType";

export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "Class";
  name: string;

  constructor(name: string, properties: AtlasObjectProps = {}) {
    super({ ...properties });

    this.name = name;
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  bind(): AtlasClass {
    return this;
  }

  set(name: Token): void {
    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = new AtlasInstance(this, new Map(this.fields));
    return (
      this.findMethod("init")?.bind(instance).call(interpreter, args) ??
      instance
    );
  }

  findMethod(name: string): (AtlasCallable & AtlasValue) | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
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