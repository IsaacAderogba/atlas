import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasNull {
  readonly type = "NULL";
  static readonly atlasClassName = "Null";

  constructor(readonly value: null) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasNull extends NativeTypeMixin {}
applyMixin(AtlasNull, NativeTypeMixin);

export { AtlasNull };
