import { Token } from "../ast/Token";
import { AtlasClass } from "./AtlasClass";
import { AtlasValue } from "./AtlasValue";
import { NativeType } from "./NativeType";

export class AtlasInstance extends NativeType {
  readonly type = "INSTANCE";
  static readonly atlasClass: AtlasClass;

  constructor(
    readonly atlasClass: AtlasClass,
    readonly fields: Map<string, AtlasValue>
  ) {
    super();
  }

  get(name: Token): AtlasValue {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.atlasClass.findMethod(name.lexeme);
    if (method) return method;

    return super.get(name);
  }

  set(name: Token, value: AtlasValue): void {
    this.fields.set(name.lexeme, value);
  }

  toString(): string {
    return `${this.atlasClass.name} instance`;
  }
}
