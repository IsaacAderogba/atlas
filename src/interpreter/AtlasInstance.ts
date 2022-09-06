import { AtlasClass } from "./AtlasClass";
import { NativeType } from "./NativeType";

export class AtlasInstance extends NativeType {
  readonly type = "INSTANCE";
  static readonly atlasClass: AtlasClass;

  constructor(readonly atlasClass: AtlasClass) {
    super();
  }

  toString(): string {
    return `${this.atlasClass.name} instance`;
  }
}
