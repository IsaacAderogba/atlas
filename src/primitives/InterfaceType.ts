import {
  attachGenericString,
  GenericTypeMap,
} from "../typechecker/GenericUtils";
import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { GenericType } from "./GenericType";

export class InterfaceType extends ObjectType {
  readonly type = "Interface";
  name: string;

  constructor(
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: GenericType[] = []
  ) {
    super(entries, generics);
    this.name = name;
  }

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const entries = bindInterfaceGenerics(this, genericTypeMap);
    return this.init(this.name, entries);
  }

  init = (
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: GenericType[] = []
  ): InterfaceType => {
    return new InterfaceType(name, entries, generics);
  };

  toString = (): string => {
    return `${this.name}${attachGenericString(this.generics)}`;
  };
}

export const bindInterfaceGenerics = (
  target: AtlasType,
  map: GenericTypeMap
): { [key: string]: AtlasType } => {
  if (!isInterfaceType(target)) throw new Error("Invariant");

  const entries: { [key: string]: AtlasType } = {};
  for (const [name, type] of target.fields) {
    entries[name] = map.get(type) || type;
  }

  for (const [name, type] of target.methods) {
    entries[name] = map.get(type) || type;
  }

  return entries;
};

export const isInterfaceType = (
  value: AtlasType
): value is AtlasType & InterfaceType =>
  value.type === "Interface" ||
  value.type === "Record" ||
  value.type === "Class" ||
  value.type === "Instance";

export const toInterfaceString = (target: AtlasType): string => {
  const props: string[] = [];

  for (const [name, type] of target.fields) {
    props.push(`"${name}": ${type.toString()}`);
  }

  for (const [name, type] of target.methods) {
    props.push(`"${name}": ${type.toString()}`);
  }

  return `{ ${props.join(", ")} }`;
};
