import { NativeType } from "./NativeType";

export class AtlasNull extends NativeType {
  readonly type = "NULL";
  static readonly atlasClassName = "Null";

  constructor(readonly value: null = null) {
    super();
  }

  toString(): string {
    return String(this.value);
  }
}
