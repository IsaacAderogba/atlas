import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../utils/Source";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";

export class Environment {
  private values = new Map<string, AtlasValue>();

  get(token: Token): AtlasValue {
    const value = this.values.get(token.lexeme);
    if (value) return value;

    throw this.error(token, RuntimeErrors.undefinedVariable());
  }

  define(name: string, value: AtlasValue): void {
    this.values.set(name, value);
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
