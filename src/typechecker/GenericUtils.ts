import { AtlasType } from "../primitives/AtlasType";
import { GenericType } from "../primitives/GenericType";

export type GenericTypeMap = Map<AtlasType, AtlasType>;

export const buildGenericTypeMap = (
  generics: GenericType[],
  actuals: AtlasType[]
): GenericTypeMap => {
  return new Map(
    generics.map((generic, i) => {
      const actual = actuals[i];
      return [generic, actual];
    })
  );
};

export const attachGenericString = (generics: GenericType[]): string => {
  if (!generics.length) return "";
  return `[${generics.map(generic => generic.param.name.lexeme).join(", ")}]`;
};
