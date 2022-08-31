import { TokenType } from "../ast/TokenType";
import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasTrue {
  readonly type: TokenType = "TRUE";
  static readonly atlasClassName = "True";

  constructor(readonly value: true = true) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasTrue extends NativeTypeMixin {}
applyMixin(AtlasTrue, NativeTypeMixin);

export { AtlasTrue };
