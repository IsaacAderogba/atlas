import { NativeType } from "./NativeType";

export class AtlasNumber extends NativeType {
  readonly type = "NUMBER";
  static readonly atlasClassName = "Number";

  constructor(readonly value: number) {
    super();
  }

  toString(): string {
    return String(this.value);
  }
}
