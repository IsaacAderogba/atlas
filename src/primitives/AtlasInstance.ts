import { Token } from "../ast/Token";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasClass, ClassType } from "./AtlasClass";
import { AtlasType } from "./AtlasType";
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
    return this.classType.name;
  }
}

export const isInstanceType = (type: unknown): type is InstanceType =>
  type instanceof InstanceType;
