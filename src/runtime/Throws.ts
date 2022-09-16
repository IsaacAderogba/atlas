import { AtlasValue } from "../primitives/AtlasValue";

export class Return {
  constructor(readonly value: AtlasValue) {
    this.value = value;
  }
}

export class Break {}

export class Continue {}
