import {
  attachGenericString,
  GenericTypeMap,
  GenericVisitedMap,
} from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { isGenericType } from "./GenericType";

export class InterfaceType extends ObjectType {
  readonly type = "Interface";
  name: string;

  constructor(
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: AtlasType[] = []
  ) {
    super(entries, generics);
    this.name = name;
  }

  bindGenerics(
    genericTypeMap: GenericTypeMap,
    visited: GenericVisitedMap
  ): AtlasType {
    const entry = visited.get(this);
    if (entry && entry.map === genericTypeMap) {
      return entry.type as InterfaceType;
    }

    const boundInterface = new InterfaceType(this.name, {}, []);
    visited.set(this, { type: boundInterface, map: genericTypeMap });
    for (const [name, type] of this.fields) {
      const value = type.bindGenerics(genericTypeMap, visited);
      boundInterface.set(name, value);
      if (isGenericType(value)) boundInterface.generics.push(value);
    }

    return boundInterface;
  }

  init = (
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: AtlasType[] = []
  ): InterfaceType => {
    return new InterfaceType(name, entries, generics);
  };

  toString = (): string => {
    return `${this.name}${attachGenericString(this.generics)}`;
  };
}

export const isInterfaceType = (
  value: AtlasType
): value is AtlasType & InterfaceType =>
  value.type === "Interface" ||
  value.type === "Class" ||
  value.type === "Instance" ||
  value.type === "Module";

export const toInterfaceString = (target: AtlasType): string => {
  const props: string[] = [];

  for (const [name, type] of target.fields) {
    props.push(`"${name}": ${type.toString()}`);
  }

  return `{ ${props.join(", ")} }`;
};
