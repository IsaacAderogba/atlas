import { AtlasType } from "../primitives/AtlasType";
import { GenericType } from "../primitives/GenericType";

export type GenericTypeMap = Map<GenericType, AtlasType>;

export const attachGenericString = (generics: GenericType[]): string => {
  if (!generics.length) return "";
  return `[${generics.map(generic => generic.name).join(", ")}]`;
};
