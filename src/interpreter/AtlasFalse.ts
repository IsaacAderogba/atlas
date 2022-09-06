import { NativeType } from "./NativeType";

export class AtlasFalse extends NativeType {
  readonly type = "FALSE";

  constructor(readonly value: false = false) {
    super();
  }

  toString(): string {
    return String(this.value);
  }
}
