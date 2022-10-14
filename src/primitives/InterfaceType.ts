import {
  attachGenericString,
  GenericTypeMap,
  GenericVisitedMap,
} from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

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
    const entries: { [key: string]: AtlasType } = {};
    for (const [name, type] of this.fields) {
      entries[name] = type.bindGenerics(genericTypeMap, visited);
    }
    return this.init(this.name, entries);
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
