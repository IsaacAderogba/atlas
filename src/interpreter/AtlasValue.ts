import { RuntimeErrors } from "../errors/RuntimeError";
import { AtlasClass } from "./AtlasClass";
import { AtlasFalse } from "./AtlasFalse";
import { AtlasFunction } from "./AtlasFunction";
import { AtlasInstance } from "./AtlasInstance";
import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasString } from "./AtlasString";
import { AtlasTrue } from "./AtlasTrue";
import {
  NativeFunction,
  NativeFunctionError,
  toNativeFunctions,
} from "./NativeFunction";

export type AtlasValue =
  | AtlasTrue
  | AtlasFalse
  | AtlasNull
  | AtlasNumber
  | AtlasString
  | AtlasFunction
  | AtlasClass
  | AtlasInstance
  | NativeFunction;

export const Boolean = new AtlasClass(
  "Boolean",
  toNativeFunctions({
    init: (value: AtlasValue) => {
      if (value.type === "TRUE") return new AtlasTrue();
      if (value.type === "FALSE") return new AtlasFalse();
      throw new NativeFunctionError(RuntimeErrors.expectedBoolean().body);
    },
  })
);
