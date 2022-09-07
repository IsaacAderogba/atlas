import { Token } from "../ast/Token";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { AtlasCallable } from "./AtlasCallable";
import { AtlasValue } from "./AtlasValue";

export type AtlasObjectProps = { [key: string]: AtlasValue };

export abstract class AtlasObject {
  abstract type: string;
  abstract toString(): string;
  methods = new Map<string, AtlasCallable & AtlasValue>();
  fields = new Map<string, AtlasValue>();

  constructor(properties: AtlasObjectProps = {}) {
    for (const [name, value] of Object.entries(properties)) {
      if (value.type === "FUNCTION" || value.type === "NATIVE_FUNCTION") {
        this.methods.set(name, value);
      } else {
        this.fields.set(name, value);
      }
    }
  }

  get(name: Token): AtlasValue {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.methods.get(name.lexeme);
    if (method) return method.bind(this);

    throw this.error(name, RuntimeErrors.undefinedProperty(name.lexeme));
  }

  set(name: Token, _: AtlasValue): void {
    throw this.error(
      name,
      RuntimeErrors.unassignablePropertyTarget(this.toString())
    );
  }

  protected error(
    source: SourceRangeable,
    message: SourceMessage
  ): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
