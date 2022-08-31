import { TokenType } from "../ast/TokenType";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasNumber {
  readonly type: TokenType = "NUMBER";
  static readonly atlasClassName = "Number";

  constructor(readonly value: number) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasNumber extends NativeTypeMixin {}
applyMixin(AtlasNumber, NativeTypeMixin);

export { AtlasNumber };
