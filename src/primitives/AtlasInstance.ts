import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasClass, ClassType } from "./AtlasClass";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { maybeBindCallable } from "./AtlasCallable";

export class AtlasInstance extends AtlasObject {
  static readonly atlasClass: AtlasClass;
  readonly type = "Instance";

  constructor(
    readonly atlasClass: AtlasClass,
    readonly fields: Map<string, AtlasValue>
  ) {
    super({});
  }

  get(name: string): AtlasValue | undefined {
    const field = this.fields.get(name);
    if (field) return maybeBindCallable(this, field);

    const value = this.atlasClass.findField(name);
    if (value) return maybeBindCallable(this, value);

    return super.get(name);
  }

  set(name: string, value: AtlasValue): void {
    this.fields.set(name, value);
  }

  toString(): string {
    return `${this.atlasClass.name} instance`;
  }
}

export class InstanceType extends ObjectType {
  readonly type = "Instance";

  constructor(readonly classType: ClassType) {
    super();
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    return this.init(this.classType.bindGenerics(genericTypeMap));
  }

  get(name: string): AtlasType | undefined {
    return this.classType.findField(name);
  }

  get fields(): ObjectType["fields"] {
    return this.classType.fields;
  }

  init = (classType: ClassType): InstanceType => new InstanceType(classType);

  toString(): string {
    return this.classType.toString();
  }
}

export const isInstanceType = (type: unknown): type is InstanceType =>
  type instanceof InstanceType;
