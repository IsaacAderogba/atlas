import { ObjectType } from "./AtlasObject";
import { AtlasType } from "./AtlasType";

export class InterfaceType extends ObjectType {
  readonly type = "Interface";

  constructor(entries: { [key: string]: AtlasType } = {}) {
    super(entries);
  }

  isSubtype(candidate: AtlasType): boolean {
    return isInterfaceSubtype(this, candidate);
  }

  static init = (): InterfaceType => new InterfaceType();
  init: typeof InterfaceType.init = () => InterfaceType.init();

  toString = (): string => this.type;
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
