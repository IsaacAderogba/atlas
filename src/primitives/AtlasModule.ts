import { GenericTypeMap, GenericVisitedMap } from "../typechecker/GenericUtils";
import { AtlasObject, ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { AtlasValue } from "./AtlasValue";

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

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): AtlasType {
    const entries: { [key: string]: AtlasType } = {};
    for (const [name, type] of this.fields) {
      entries[name] = type.bindGenerics(genericTypeMap, visited);
    }
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
