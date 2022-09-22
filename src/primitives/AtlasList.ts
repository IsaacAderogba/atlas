import { AtlasNull, NullType } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { NativeFnType, toNativeFunctions } from "./AtlasNativeFn";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { GenericType } from "./GenericType";
import { UnionType } from "./UnionType";
import { isAtlasNumber, NumberType } from "./AtlasNumber";
import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";

export class AtlasList extends AtlasObject {
  readonly type = "List";

  constructor(readonly items: AtlasValue[] = []) {
    super(
      toNativeFunctions({
        add: AtlasList.prototype.add,
        at: AtlasList.prototype.at,
        remove: AtlasList.prototype.remove,
      })
    );
  }

  add(item: AtlasValue): AtlasValue {
    this.items.push(item);
    return item;
  }

  at(index: AtlasValue): AtlasValue {
    if (!isAtlasNumber(index)) {
      throw new NativeError(RuntimeErrors.expectedNumber());
    }

    return this.items[index.value] ?? new AtlasNull();
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
        at: new NativeFnType({
          params: [new NumberType()],
          returns: new UnionType([itemType, new NullType()]),
        }),
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
