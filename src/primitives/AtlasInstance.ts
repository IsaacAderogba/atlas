import { Token } from "../ast/Token";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasClass, ClassType } from "./AtlasClass";
import { AtlasType } from "./AtlasType";
import { isInterfaceSubtype } from "./InterfaceType";
import { isAnyType } from "./AnyType";

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

  get(name: Token): AtlasType | undefined {
    return this.classType.findProp(name.lexeme);
  }

  get fields(): ObjectType["fields"] {
    return this.classType.fields;
  }

  get methods(): ObjectType["methods"] {
    return this.classType.methods;
  }

  isSubtype(candidate: AtlasType): boolean {
    if (this === candidate) return true;
    return isInterfaceSubtype(this, candidate);
  }

  static init = (classType: ClassType): InstanceType =>
    new InstanceType(classType);

  init: typeof InstanceType.init = (...props) => InstanceType.init(...props);

  toString(): string {
    return `${this.classType.name}`;
  }
}

export const isInstanceType = (type: unknown): type is InstanceType =>
  type instanceof InstanceType;
