import { AliasType } from "./AliasType";
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
import { GenericType } from "./GenericType";
import { InterfaceType } from "./InterfaceType";
import { IntersectionType } from "./IntersectionType";
import { UnionType } from "./UnionType";

export type AtlasType =
  | AnyType
  | AliasType
  | BooleanType
  | GenericType
  | NumberType
  | StringType
  | NullType
  | RecordType
  | FunctionType
  | NativeFnType
  | ClassType
  | InstanceType
  | InterfaceType
  | IntersectionType
  | UnionType;

const Any = new AnyType();
const Class = new ClassType("Class", {});

export const Types = {
  Any,
  Alias: new AliasType("Alias", Any),
  Null: new NullType(),
  Boolean: new BooleanType(),
  Number: new NumberType(),
  String: new StringType(),
  Record: new RecordType({}),
  Function: new FunctionType({ params: [], returns: Any }),
  NativeFn: new NativeFnType({ params: [], returns: Any }),
  Class: Class,
  Instance: new InstanceType(Class),
  Interface: new InterfaceType("Interface"),
  Intersection: new IntersectionType([]),
  Union: new UnionType([]),
} as const;
