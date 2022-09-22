import { AtlasNull, NullType } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { NativeFnType, toNativeFunctions } from "./AtlasNativeFn";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { GenericType } from "./GenericType";
import { UnionType } from "./UnionType";

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

  constructor(readonly itemType: AtlasType) {
    super(
      {
        add: new NativeFnType({ params: [itemType], returns: itemType }),
        remove: new NativeFnType({
          params: [],
          returns: new UnionType([itemType, new NullType()]),
        }),
      },
      [new GenericType("T")]
    );
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const mappedItem = genericTypeMap.get(this.generics[0])!;
    const itemType = mappedItem.bindGenerics(genericTypeMap);
    return this.init(itemType);
  }

  init = (itemType: AtlasType): ListType => {
    return new ListType(itemType);
  };

  toString = (): string => `[${this.itemType.toString()}]`;
}

export const isListType = (type: AtlasType): type is ListType =>
  type.type === "List";
