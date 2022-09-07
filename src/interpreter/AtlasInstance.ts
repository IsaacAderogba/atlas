import { Token } from "../ast/Token";
import { AtlasClass } from "./AtlasClass";
import { AtlasValue } from "./AtlasValue";
import { AtlasObject } from "./AtlasObject";

export class AtlasInstance extends AtlasObject {
  static readonly atlasClass: AtlasClass;
  readonly type = "INSTANCE";

  constructor(
    readonly atlasClass: AtlasClass,
    readonly fields: Map<string, AtlasValue>
  ) {
    super({});
  }

  get(name: Token): AtlasValue {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.atlasClass.findMethod(name.lexeme);
    if (method) return method.bind(this);

    return super.get(name);
  }

  set(name: Token, value: AtlasValue): void {
    this.fields.set(name.lexeme, value);
  }

  toString(): string {
    return `${this.atlasClass.name} instance`;
  }
}
