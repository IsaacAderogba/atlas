import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { AtlasValue } from "../primitives/AtlasValue";

export class Environment {
  values: { [key: string]: AtlasValue } = {};
  readonly enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  static fromGlobals(obj: { [name: string]: AtlasValue }): Environment {
    const environment = new Environment();
    for (const [name, value] of Object.entries(obj)) {
      environment.define(name, value);
    }
    return environment;
  }

  get(name: string, token: Token): AtlasValue {
    const value = this.values[name];

    if (value) return value;
    if (this.enclosing) return this.enclosing.get(name, token);

    throw this.error(token, RuntimeErrors.undefinedVariable(name));
  }

  assign(token: Token, value: AtlasValue): void {
    if (this.values[token.lexeme]) {
      this.values[token.lexeme] = value;
    } else if (this.enclosing) {
      this.enclosing.assign(token, value);
    } else {
      throw this.error(token, RuntimeErrors.undefinedVariable(token.lexeme));
    }
  }

  define(name: string, value: AtlasValue): void {
    this.values[name] = value;
  }

  ancestor(distance: number): Environment {
    let environment = this as Environment;

    for (let i = 0; i < distance && environment.enclosing; i++) {
      environment = environment.enclosing;
    }

    return environment;
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
