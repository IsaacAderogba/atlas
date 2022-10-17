import { AtlasType } from "../primitives/AtlasType";

export type GenericTypeMap = Map<AtlasType, AtlasType>;
export type GenericVisitedMap = Map<
  AtlasType,
  { type: AtlasType; map: GenericTypeMap }
>;

export const attachGenericString = (generics: AtlasType[]): string => {
  if (!generics.length) return "";
  return `[${generics.map(generic => generic.toString()).join(", ")}]`;
};
