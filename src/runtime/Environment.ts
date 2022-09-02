import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../utils/Source";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";

export class Environment {
  private values = new Map<string, AtlasValue>();

  get(token: Token): AtlasValue {
    const value = this.values.get(token.lexeme);
    if (value) return value;

    throw this.error(token, RuntimeErrors.undefinedVariable(token.lexeme));
  }

  define(token: Token, value: AtlasValue): void {
    if (this.values.has(token.lexeme)) {
      throw this.error(token, RuntimeErrors.prohibitedRedeclaration());
    }
    this.values.set(token.lexeme, value);
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
