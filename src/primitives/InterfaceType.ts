import {
  attachGenericString,
  GenericTypeMap,
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

  bindGenerics(genericTypeMap: GenericTypeMap): AtlasType {
    const { entries } = bindInterfaceGenerics(this, genericTypeMap);
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

export const bindInterfaceGenerics = (
  target: AtlasType,
  map: GenericTypeMap
): { entries: { [key: string]: AtlasType } } => {
  if (!isInterfaceType(target)) throw new Error(`Invariant ${target.type}`);

  const entries: { [key: string]: AtlasType } = {};
  for (const [name, type] of target.fields) {
    entries[name] = type.bindGenerics(map);
  }

  for (const [name, type] of target.methods) {
    entries[name] = type.bindGenerics(map);
  }

  return { entries };
};

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

  for (const [name, type] of target.methods) {
    props.push(`"${name}": ${type.toString()}`);
  }

  return `{ ${props.join(", ")} }`;
};
