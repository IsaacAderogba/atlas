import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasFalse {
  readonly type = "FALSE";
  static readonly atlasClassName = "False";

  constructor(readonly value: false = false) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasFalse extends NativeTypeMixin {}
applyMixin(AtlasFalse, NativeTypeMixin);

export { AtlasFalse };
