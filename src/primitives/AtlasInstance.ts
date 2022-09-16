import { Token } from "../ast/Token";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject } from "./AtlasObject";
import { AtlasClass } from "./AtlasClass";

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
