import { AliasType } from "./AliasType";
import { AnyType } from "./AnyType";
import { BooleanType } from "./AtlasBoolean";
import { ClassType } from "./AtlasClass";
import { FunctionType } from "./AtlasFunction";
import { InstanceType } from "./AtlasInstance";
import { ListType } from "./AtlasList";
import { ModuleType } from "./AtlasModule";
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
  | ModuleType
  | NativeFnType
  | ClassType
  | InstanceType
  | InterfaceType
  | IntersectionType
  | ListType
  | UnionType;

const Any = new AnyType();
const Class = new ClassType("Class", {});

export const ValueTypes = {
  Boolean: new BooleanType(),
  Class: Class,
  Function: new FunctionType({ params: [], returns: Any }),
  Instance: new InstanceType(Class),
  List: new ListType(Any),
  Module: new ModuleType("Module", {}),
  NativeFn: new NativeFnType({ params: [], returns: Any }),
  Null: new NullType(),
  Number: new NumberType(),
  Record: new RecordType(Any),
  String: new StringType(),
} as const;

export const Types = {
  ...ValueTypes,
  Any,
  Alias: new AliasType("Alias", Any),
  Interface: new InterfaceType("Interface"),
  Intersection: new IntersectionType([]),
  Union: new UnionType([]),
} as const;
