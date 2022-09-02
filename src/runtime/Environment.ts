import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../utils/Source";
import { AtlasValue } from "./AtlasValue";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";

export class Environment {
  private values = new Map<string, AtlasValue>();
  readonly enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  get(token: Token): AtlasValue {
    const value = this.values.get(token.lexeme);

    if (value) return value;
    if (this.enclosing) return this.enclosing.get(token);

    throw this.error(token, RuntimeErrors.undefinedVariable(token.lexeme));
  }

  assign(token: Token, value: AtlasValue): void {
    if (this.values.has(token.lexeme)) {
      this.values.set(token.lexeme, value);
    } else if (this.enclosing) {
      this.enclosing.assign(token, value);
    } else {
      throw this.error(token, RuntimeErrors.undefinedVariable(token.lexeme));
    }
  }

  define(name: string, value: AtlasValue, token?: Token): void {
    if (this.values.has(name) && token) {
      throw this.error(token, RuntimeErrors.prohibitedRedeclaration());
    }

    this.values.set(name, value);
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
