import { AtlasType } from "../primitives/AtlasType";
import { isGenericType } from "../primitives/GenericType";

export type GenericTypeMap = Map<AtlasType, AtlasType>;

export const attachGenericString = (generics: AtlasType[]): string => {
  if (!generics.length) return "";
  return `[${generics
    .filter(isGenericType)
    .map(generic => generic.name)
    .join(", ")}]`;
};
