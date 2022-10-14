import { AtlasType } from "../primitives/AtlasType";
import { isGenericType } from "../primitives/GenericType";

export type GenericTypeMap = Map<AtlasType, AtlasType>;
export type GenericVisitedMap = Map<AtlasType, { type: AtlasType, map: GenericTypeMap }>;

export const attachGenericString = (generics: AtlasType[]): string => {
  if (!generics.length) return "";
  return `[${generics
    .filter(isGenericType)
    .map(generic => generic.name)
    .join(", ")}]`;
};
