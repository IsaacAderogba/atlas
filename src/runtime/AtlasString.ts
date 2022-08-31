import { TokenType } from "../ast/TokenType";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasString {
  readonly type: TokenType = "STRING";
  static readonly atlasClassName = "String";

  constructor(readonly value: string) {}

  toString(): string {
    return this.value;
  }
}

interface AtlasString extends NativeTypeMixin {}
applyMixin(AtlasString, NativeTypeMixin);

export { AtlasString };
