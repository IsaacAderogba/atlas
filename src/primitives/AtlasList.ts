import { AtlasNull } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { toNativeFunctions } from "./AtlasNativeFn";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";

export class AtlasList extends AtlasObject {
  readonly type = "List";

  constructor(readonly items: AtlasValue[] = []) {
    super(
      toNativeFunctions({
        add: AtlasList.prototype.add,
        remove: AtlasList.prototype.remove,
      })
    );
  }

  add(item: AtlasValue): AtlasValue {
    this.items.push(item);
    return item;
  }

  remove(): AtlasValue {
    const value = this.items.pop();
    return value || new AtlasNull();
  }

  toString(): string {
    return `[${this.items.join(", ")}]`;
  }
}

export class ListType extends ObjectType {
  readonly type = "List";

  constructor(readonly types: AtlasType[] = []) {
    super();
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const types = this.types.map(type => type.bindGenerics(genericTypeMap));
    return this.init(types);
  }

  init = (types: AtlasType[] = []): ListType => {
    return new ListType(types);
  };

  toString = (): string =>
    `[${this.types.map(type => type.toString()).join(", ")}]`;
}

export const isListType = (type: AtlasType): type is ListType =>
  type.type === "List";
