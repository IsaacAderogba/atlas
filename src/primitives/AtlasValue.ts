import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { AtlasBoolean } from "./AtlasBoolean";
import { AtlasClass } from "./AtlasClass";
import { AtlasFunction } from "./AtlasFunction";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasList } from "./AtlasList";
import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasRecord } from "./AtlasRecord";
import { AtlasString } from "./AtlasString";
import { AtlasNativeFn, toNativeFunctions } from "./AtlasNativeFn";

export type AtlasValue =
  | AtlasBoolean
  | AtlasNull
  | AtlasNumber
  | AtlasString
  | AtlasClass
  | AtlasInstance
  | AtlasList
  | AtlasRecord
  | AtlasFunction
  | AtlasNativeFn;

export const Boolean = new AtlasClass(
  "Boolean",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Null = new AtlasClass(
  "Null",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Number = new AtlasClass(
  "Number",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const List = new AtlasClass(
  "List",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Record = new AtlasClass(
  "Record",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const String = new AtlasClass(
  "String",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Function = new AtlasClass(
  "Function",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Class = new AtlasClass(
  "Class",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const Instance = new AtlasClass(
  "Instance",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const NativeFn = new AtlasClass(
  "NativeFn",
  toNativeFunctions({
    init: () => {
      throw new NativeError(RuntimeErrors.prohibitedInitializer());
    },
  })
);

export const primitives = {
  Boolean,
  Class,
  Function,
  Instance,
  List,
  NativeFn,
  Null,
  Number,
  Record,
  String,
};
