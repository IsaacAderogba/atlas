import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasNumber {
  readonly type = "NUMBER";
  static readonly atlasClassName = "Number";

  constructor(readonly value: number) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasNumber extends NativeTypeMixin {}
applyMixin(AtlasNumber, NativeTypeMixin);

export { AtlasNumber };
