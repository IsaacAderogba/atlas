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

  get(token: Token): AtlasValue {
    const value = this.values[token.lexeme];

    if (value) return value;
    if (this.enclosing) return this.enclosing.get(token);

    throw this.error(token, RuntimeErrors.undefinedVariable(token.lexeme));
  }

  getAt(name: string, distance: number, token?: Token): AtlasValue {
    const value = this.ancestor(distance).values[name];

    if (value === undefined) {
      const err = RuntimeErrors.unresolvedVariable(name, distance);
      if (!token) throw new Error(`${err.title}: ${err.body}`);
      throw this.error(token, err);
    }

    return value;
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

  assignAt(distance: number, name: Token, value: AtlasValue): void {
    this.ancestor(distance).values[name.lexeme] = value;
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
