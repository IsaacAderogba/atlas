import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { AtlasClass } from "./AtlasClass";
import { AtlasFalse } from "./AtlasFalse";
import { AtlasFunction } from "./AtlasFunction";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasList } from "./AtlasList";
import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasRecord } from "./AtlasRecord";
import { AtlasString } from "./AtlasString";
import { AtlasTrue } from "./AtlasTrue";
import { AtlasNativeFn, toNativeFunctions } from "./AtlasNativeFn";

export type AtlasValue =
  | AtlasTrue
  | AtlasFalse
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
    init: (value: AtlasValue) => {
      if (value.type === "TRUE") return new AtlasTrue();
      if (value.type === "FALSE") return new AtlasFalse();
      throw new NativeError(RuntimeErrors.expectedBoolean());
    },
  })
);

export const Null = new AtlasClass(
  "Null",
  toNativeFunctions({
    init: () => new AtlasNull(),
  })
);

export const Number = new AtlasClass(
  "Number",
  toNativeFunctions({
    init: (value: AtlasValue) => {
      if (value.type === "NUMBER") return new AtlasNumber(value.value);
      throw new NativeError(RuntimeErrors.expectedNumber());
    },
  })
);

export const List = new AtlasClass(
  "List",
  toNativeFunctions({
    init: () => {
      return new AtlasList();
    },
  })
);

export const Record = new AtlasClass(
  "Record",
  toNativeFunctions({
    init: () => {
      return new AtlasRecord();
    },
  })
);

export const String = new AtlasClass(
  "String",
  toNativeFunctions({
    init: (value: AtlasValue) => {
      if (value.type === "STRING") return new AtlasString(value.value);
      throw new NativeError(RuntimeErrors.expectedString());
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
