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

export const Types = {
  Any: AnyType.init(),
  Null: NullType.init(),
  Boolean: BooleanType.init(),
  Number: NumberType.init(),
  String: StringType.init(),
  Record: RecordType.init({}),
  Function: FunctionType.init({ params: [], returns: NullType.init() }),
  NativeFn: NativeFnType.init({ params: [], returns: NullType.init() }),
  Never: NeverType.init(),
  Class: ClassType.init("Class"),
  Instance: InstanceType.init(ClassType.init("Class")),
  Interface: InterfaceType.init("Interface"),
  Intersection: IntersectionType.init([]),
  Union: UnionType.init([]),
  Unknown: UnknownType.init(),
} as const;
