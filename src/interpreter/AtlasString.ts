import { NativeType } from "./NativeType";

export class AtlasString extends NativeType {
  readonly type = "STRING";
  static readonly atlasClassName = "String";

  constructor(readonly value: string) {
    super();
  }

  toString(): string {
    return this.value;
  }
}
