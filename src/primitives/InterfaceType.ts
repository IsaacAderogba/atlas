import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";
import { GenericParamType } from "./AtlasValue";

export class InterfaceType extends ObjectType {
  readonly type = "Interface";
  name: string;

  constructor(
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: GenericParamType[] = []
  ) {
    super(entries, generics);
    this.name = name;
  }

  init = (
    name: string,
    entries: { [key: string]: AtlasType } = {},
    generics: GenericParamType[] = []
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
