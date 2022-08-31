import { TokenType } from "../ast/TokenType";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasNull {
  readonly type: TokenType = "NULL";
  static readonly atlasClassName = "Null";

  constructor(readonly value: null = null) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasNull extends NativeTypeMixin {}
applyMixin(AtlasNull, NativeTypeMixin);

export { AtlasNull };
