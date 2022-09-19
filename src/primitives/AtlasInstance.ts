import { Token } from "../ast/Token";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasClass, ClassType } from "./AtlasClass";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericTypeMap";

export class AtlasInstance extends AtlasObject {
  static readonly atlasClass: AtlasClass;
  readonly type = "Instance";

  constructor(
    readonly atlasClass: AtlasClass,
    readonly fields: Map<string, AtlasValue>
  ) {
    super({});
  }

  get(name: Token): AtlasValue {
    const field = this.fields.get(name.lexeme);
    if (field) return field;

    const method = this.atlasClass.findMethod(name.lexeme);
    if (method) return method.bind(this);

    return super.get(name);
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
    return this;
  }

  get(name: Token): AtlasType | undefined {
    return this.classType.findProp(name.lexeme);
  }

  get fields(): ObjectType["fields"] {
    return this.classType.fields;
  }

  get methods(): ObjectType["methods"] {
    return this.classType.methods;
  }

  init = (classType: ClassType): InstanceType => new InstanceType(classType);

  toString(): string {
    return `${this.classType.name}`;
  }
}

export const isInstanceType = (type: unknown): type is InstanceType =>
  type instanceof InstanceType;
