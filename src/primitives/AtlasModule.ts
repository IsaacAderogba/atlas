import { GenericTypeMap } from "../typechecker/GenericUtils";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";
import { bindInterfaceGenerics } from "./InterfaceType";

export class AtlasModule extends AtlasObject {
  readonly type = "Module";

  constructor(
    readonly name: string,
    entries: { [key: string]: AtlasValue } = {}
  ) {
    super(entries);
  }

  toString(): string {
    return this.name;
  }
}

export const atlasModule = (
  name: string,
  entries: { [key: string]: AtlasValue } = {}
): AtlasModule => new AtlasModule(name, entries);

export class ModuleType extends ObjectType {
  readonly type = "Module";

  constructor(
    readonly name: string,
    entries: { [key: string]: AtlasType } = {}
  ) {
    super(entries);
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const { entries } = bindInterfaceGenerics(this, genericTypeMap);
    return this.init(this.name, entries);
  }

  init = (
    name: string,
    entries: { [key: string]: AtlasType } = {}
  ): ModuleType => {
    return new ModuleType(name, entries);
  };

  toString = (): string => {
    return this.name;
  };
}

export const isModuleType = (type: AtlasType): type is ModuleType =>
  type.type === "Module";
