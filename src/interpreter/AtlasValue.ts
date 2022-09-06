import { AtlasClass } from "./AtlasClass";
import { AtlasFalse } from "./AtlasFalse";
import { AtlasFunction } from "./AtlasFunction";
import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { AtlasString } from "./AtlasString";
import { AtlasTrue } from "./AtlasTrue";
import { NativeFunction } from "./NativeFunction";

export type AtlasValue =
  | AtlasTrue
  | AtlasFalse
  | AtlasNull
  | AtlasNumber
  | AtlasString
  | AtlasFunction
  | AtlasClass
  | NativeFunction;
