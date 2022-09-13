import { Token } from "../ast/Token";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { RuntimeError } from "../errors/RuntimeError";
import { AtlasType } from "../primitives/AtlasType";
import { TypeCheckErrors } from "../errors/TypeCheckError";

export class TypeEnvironment {
  private values = new Map<string, AtlasType>();
  readonly enclosing?: TypeEnvironment;

  constructor(enclosing?: TypeEnvironment) {
    this.enclosing = enclosing;
  }

  static fromGlobals(obj: { [name: string]: AtlasType }): TypeEnvironment {
    const environment = new TypeEnvironment();
    for (const [name, value] of Object.entries(obj)) {
      environment.define(name, value);
    }
    return environment;
  }

  get(token: Token): AtlasType {
    const value = this.values.get(token.lexeme);

    if (value) return value;
    if (this.enclosing) return this.enclosing.get(token);

    throw this.error(token, TypeCheckErrors.undefinedType(token.lexeme));
  }

  define(name: string, value: AtlasType, token?: Token): void {
    if (this.values.has(name) && token) {
      throw this.error(token, TypeCheckErrors.prohibitedTypeRedeclaration());
    }

    this.values.set(name, value);
  }

  private error(source: SourceRangeable, message: SourceMessage): RuntimeError {
    return new RuntimeError(message, source.sourceRange());
  }
}
