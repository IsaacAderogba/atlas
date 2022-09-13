import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { RuntimeError } from "../errors/RuntimeError";
import { TypeCheckErrors } from "../errors/TypeCheckError";

export class TypeEnvironment<T> {
  private values = new Map<string, T>();
  readonly enclosing?: TypeEnvironment<T>;

  constructor(enclosing?: TypeEnvironment<T>) {
    this.enclosing = enclosing;
  }

  static fromGlobals<T>(obj: { [name: string]: T }): TypeEnvironment<T> {
    const environment = new TypeEnvironment<T>();
    for (const [name, value] of Object.entries(obj)) {
      environment.set(name, value);
    }
    return environment;
  }

  get(token: Token): T {
    const value = this.values.get(token.lexeme);

    if (value) return value;
    if (this.enclosing) return this.enclosing.get(token);

    throw this.error(token, TypeCheckErrors.undefinedType(token.lexeme));
  }

  set(name: string, value: T, token?: Token): void {
    if (this.values.has(name) && token) {
      throw this.error(token, TypeCheckErrors.prohibitedTypeRedeclaration());
    }

    this.values.set(name, value);
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
