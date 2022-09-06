import { NativeType } from "./NativeType";

export class AtlasString extends NativeType {
  readonly type = "STRING";

  constructor(readonly value: string) {
    super();
  }

  toString(): string {
    return this.value;
  }
}
