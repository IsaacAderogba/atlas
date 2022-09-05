import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasTrue {
  readonly type = "TRUE";
  static readonly atlasClassName = "True";

  constructor(readonly value: true = true) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasTrue extends NativeTypeMixin {}
applyMixin(AtlasTrue, NativeTypeMixin);

export { AtlasTrue };
