import { AtlasInstance, InstanceType } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import {
  AtlasObject,
  AtlasObjectProps,
  ObjectType,
  ObjectTypeProps,
} from "./AtlasObject";
import { Token } from "../ast/Token";
import { RuntimeErrors } from "../errors/RuntimeError";
import { AtlasCallable, CallableType } from "./AtlasCallable";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericTypeMap";

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

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return this;
  }

  arity(): number {
    return this.findMethod("init")?.arity() || 0;
  }

  get params(): AtlasType[] {
    return this.findMethod("init")?.params || [];
  }

  get returns(): AtlasType {
    return new InstanceType(this);
  }

  findField(name: string): AtlasType | undefined {
    return this.fields.get(name);
  }

  findMethod(name: string): (CallableType & AtlasType) | undefined {
    return this.methods.get(name);
  }

  findProp(name: string): AtlasType | undefined {
    return this.findField(name) || this.findMethod(name);
  }

  init = (name: string, properties: ObjectTypeProps = {}): ClassType =>
    new ClassType(name, properties);

  toString(): string {
    return `${this.name}`;
  }
}

export const isClassType = (type: unknown): type is ClassType =>
  type instanceof ClassType;
