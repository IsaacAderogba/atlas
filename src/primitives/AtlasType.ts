import { AnyType } from "./AnyType";
import { BooleanType } from "./AtlasBoolean";
import { ClassType } from "./AtlasClass";
import { FunctionType } from "./AtlasFunction";
import { InstanceType } from "./AtlasInstance";
import { NativeFnType } from "./AtlasNativeFn";
import { NullType } from "./AtlasNull";
import { NumberType } from "./AtlasNumber";
import { RecordType } from "./AtlasRecord";
import { StringType } from "./AtlasString";
import { InterfaceType } from "./InterfaceType";
import { IntersectionType } from "./IntersectionType";
import { NeverType } from "./NeverType";
import { UnionType } from "./UnionType";
import { UnknownType } from "./UnknownType";

export type AtlasType =
  | AnyType
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType
  | FunctionType
  | NativeFnType
  | NeverType
  | ClassType
  | InstanceType
  | InterfaceType
  | IntersectionType
  | UnionType
  | UnknownType;

const Any = new AnyType();
const Class = new ClassType("Class", {});

export const Types = {
  Any,
  Null: new NullType(),
  Boolean: new BooleanType(),
  Number: new NumberType(),
  String: new StringType(),
  Record: new RecordType({}),
  Function: new FunctionType({ params: [], returns: Any }),
  NativeFn: new NativeFnType({ params: [], returns: Any }),
  Never: new NeverType(),
  Class: Class,
  Instance: new InstanceType(Class),
  Interface: new InterfaceType("Interface"),
  Intersection: new IntersectionType([]),
  Union: new UnionType([]),
  Unknown: new UnknownType(),
} as const;
