import { NativeType } from "./NativeType";

export class AtlasTrue extends NativeType {
  readonly type = "TRUE";
  static readonly atlasClassName = "True";

  constructor(readonly value: true = true) {
    super();
  }

  toString(): string {
    return String(this.value);
  }
}
