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

export type AtlasType =
  | AnyType
  | BooleanType
  | NumberType
  | StringType
  | NullType
  | RecordType
  | FunctionType
  | NativeFnType
  | ClassType
  | InstanceType
  | InterfaceType;

export const Types = {
  Any: AnyType.init(),
  Null: NullType.init(),
  Boolean: BooleanType.init(),
  Number: NumberType.init(),
  String: StringType.init(),
  Record: RecordType.init({}),
  Function: FunctionType.init({ params: [], returns: NullType.init() }),
  NativeFn: NativeFnType.init({ params: [], returns: NullType.init() }),
  Class: ClassType.init("Class"),
  Instance: InstanceType.init(ClassType.init("Class")),
  Interface: InterfaceType.init("Interface"),
} as const;
