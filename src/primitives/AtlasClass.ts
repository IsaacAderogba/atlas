import { atlasInstance, InstanceType } from "./AtlasInstance";
import { AtlasValue } from "./AtlasValue";
import {
  AtlasObject,
  AtlasObjectProps,
  ObjectType,
  ObjectTypeProps,
} from "./AtlasObject";
import {
  AtlasCallable,
  CallableType,
  isCallable,
  isCallableType,
} from "./AtlasCallable";
import { Interpreter } from "../runtime/Interpreter";
import { AtlasType } from "./AtlasType";
import {
  attachGenericString,
  GenericTypeMap,
  GenericVisitedMap,
} from "../typechecker/GenericUtils";

export class AtlasClass extends AtlasObject implements AtlasCallable {
  readonly type = "Class";
  name: string;

  constructor(name: string, properties: AtlasObjectProps = {}) {
    super({ ...properties });

    this.name = name;
  }

  arity(): number {
    const init = this.findField("init");
    if (init && isCallable(init)) return init.arity();
    return 0;
  }

  bind(): AtlasClass {
    return this;
  }

  call(interpreter: Interpreter, args: AtlasValue[]): AtlasValue {
    const instance = atlasInstance(this);
    const init = this.findField("init");
    if (init && isCallable(init)) init.bind(instance).call(interpreter, args);
    return instance;
  }

  findField(name: string): AtlasValue | undefined {
    return this.fields.get(name);
  }

  toString(): string {
    return this.name;
  }
}

export const atlasClass = (
  name: string,
  properties: AtlasObjectProps = {}
): AtlasClass => new AtlasClass(name, properties);

export class ClassType extends ObjectType implements CallableType {
  readonly type = "Class";

  constructor(
    public name: string,
    properties: ObjectTypeProps,
    generics: AtlasType[] = []
  ) {
    super(properties, generics);
  }

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): ClassType {
    const entries: { [key: string]: AtlasType } = {};
    for (const [name, type] of this.fields) {
      entries[name] = type.bindGenerics(genericTypeMap, visited);
    }

    return this.init(this.name, entries);
  }

  arity(): number {
    const init = this.findField("init");
    if (init && isCallableType(init)) return init.arity();
    return 0;
  }

  get params(): AtlasType[] {
    const init = this.findField("init");
    if (init && isCallableType(init)) return init.params;
    return [];
  }

  get returns(): AtlasType {
    return new InstanceType(this);
  }

  findField(name: string): AtlasType | undefined {
    return this.fields.get(name);
  }

  init = (
    name: string,
    properties: ObjectTypeProps = {},
    generics: AtlasType[] = []
  ): ClassType => new ClassType(name, properties, generics);

  toString(): string {
    return `${this.name}${attachGenericString(this.generics)}`;
  }
}

export const isClassType = (type: unknown): type is ClassType =>
  type instanceof ClassType;
