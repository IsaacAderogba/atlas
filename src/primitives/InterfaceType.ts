import { GenericTypeMap } from "../typechecker/GenericTypeMap";
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
    return this;
  }

  init = (
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: GenericType[] = []
  ): InterfaceType => {
    return new InterfaceType(name, entries, generics);
  };

  toString = (): string => `${this.name}`;
}

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
