import { atlasNull, AtlasNull, NullType } from "./AtlasNull";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasValue } from "./AtlasValue";
import { NativeFnType, toNativeFunctions } from "./AtlasNativeFn";
import { AtlasType } from "./AtlasType";
import { GenericTypeMap } from "../typechecker/GenericUtils";
import { GenericType, isGenericType } from "./GenericType";
import { UnionType } from "./UnionType";
import { atlasNumber, isAtlasNumber, NumberType } from "./AtlasNumber";
import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { Interpreter } from "../runtime/Interpreter";
import { FunctionType, isAtlasFunction } from "./AtlasFunction";

export class AtlasList extends AtlasObject {
  readonly type = "List";

  constructor(readonly items: AtlasValue[] = []) {
    super(
      toNativeFunctions({
        add: AtlasList.prototype.add,
        at: AtlasList.prototype.at,
        forEach: AtlasList.prototype.forEach,
        remove: AtlasList.prototype.remove,
      })
    );
  }

  add(_: Interpreter, item: AtlasValue): AtlasValue {
    this.items.push(item);
    return item;
  }

  at(_: Interpreter, index: AtlasValue): AtlasValue {
    if (!isAtlasNumber(index)) {
      throw new NativeError(RuntimeErrors.expectedNumber());
    }

    return this.items[index.value] ?? new AtlasNull();
  }

  forEach(interpreter: Interpreter, callback: AtlasValue): AtlasValue {
    if (!isAtlasFunction(callback)) {
      throw new NativeError(RuntimeErrors.expectedFunction());
    }

    this.items.forEach((item, i) => {
      callback.call(interpreter, [item, atlasNumber(i)]);
    });

    return atlasNull();
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

  constructor(readonly itemType: AtlasType = new GenericType("T")) {
    const generics = isGenericType(itemType) ? [itemType] : [];

    super(
      {
        add: new NativeFnType({ params: [itemType], returns: itemType }),
        at: new NativeFnType({
          params: [new NumberType()],
          returns: new UnionType([itemType, new NullType()]),
        }),
        forEach: new NativeFnType({
          params: [
            new FunctionType({
              params: [itemType, new NumberType()],
              returns: new NullType(),
            }),
          ],
          returns: new NullType(),
        }),
        remove: new NativeFnType({
          params: [],
          returns: new UnionType([itemType, new NullType()]),
        }),
      },
      generics
    );
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    if (this.generics.length === 0) return this;

    const mappedItem = genericTypeMap.get(this.generics[0])!;
    const itemType = mappedItem.bindGenerics(genericTypeMap);
    return this.init(itemType);
  }

  init = (itemType: AtlasType): ListType => {
    return new ListType(itemType);
  };

  toString = (): string => `List[${this.itemType.toString()}]`;
}

export const isListType = (type: AtlasType): type is ListType =>
  type.type === "List";
