import { Token } from "../ast/Token";
import { Errors } from "../utils/Errors";
import { SourceRangeable } from "../utils/Source";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError } from "./RuntimeError";

export class Environment {
  private values = new Map<string, AtlasValue>();

  get(token: Token): AtlasValue {
    const value = this.values.get(token.lexeme);
    if (value) return value;

    throw this.error(token, Errors.UndefinedVariable);
  }

  define(name: string, value: AtlasValue): void {
    this.values.set(name, value);
  }

  private error(source: SourceRangeable, message: string): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
