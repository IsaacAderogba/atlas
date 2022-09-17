import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class InterfaceType extends ObjectType {
  readonly type = "Interface";
  name: string;

  constructor(name: string, entries: { [key: string]: AtlasType } = {}) {
    super(entries);
    this.name = name;
  }

  isSubtype(candidate: AtlasType): boolean {
    return isInterfaceSubtype(this, candidate);
  }

  static init = (
    name: string,
    entries: { [key: string]: AtlasType } = {}
  ): InterfaceType => {
    return new InterfaceType(name, entries);
  };

  init: typeof InterfaceType.init = (...props) => InterfaceType.init(...props);

  toString = (): string => `${this.name} ${toInterfaceString(this)}`;
}

export const isInterfaceType = (
  value: AtlasType
): value is AtlasType & InterfaceType =>
  value.type === "Interface" ||
  value.type === "Record" ||
  value.type === "Class" ||
  value.type === "Instance";

export const isInterfaceSubtype = (
  target: AtlasType,
  candidate: AtlasType
): boolean => {
  if (candidate.type === "Any") return true;
  if (!isInterfaceType(candidate)) return false;

  const fields = [...candidate.fields.entries()].every(([name, type]) => {
    const compare = target.fields.get(name);
    if (compare) return compare.isSubtype(type);
    return false;
  });

  const methods = [...candidate.methods.entries()].every(([name, type]) => {
    const compare = target.methods.get(name);
    if (compare) return compare.isSubtype(type);
    return false;
  });

  return fields && methods;
};

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
