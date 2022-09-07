import { Token } from "../ast/Token";
import { RuntimeError, RuntimeErrors } from "../errors/RuntimeError";
import { SourceMessage, SourceRangeable } from "../errors/SourceError";
import { AtlasValue } from "./AtlasValue";

export abstract class NativeType {
  abstract readonly type: string;
  abstract toString(): string;

  get(name: Token): AtlasValue {
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
