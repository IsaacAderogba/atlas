import { applyMixin, NativeTypeMixin } from "./NativeTypeMixin";

class AtlasBool {
  readonly type = "BOOL";
  static readonly atlasClassName = "Bool";

  constructor(readonly value: boolean) {}

  toString(): string {
    return String(this.value);
  }
}

interface AtlasBool extends NativeTypeMixin {}
applyMixin(AtlasBool, NativeTypeMixin);

export { AtlasBool };
