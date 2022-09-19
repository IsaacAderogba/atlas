import { AtlasType } from "../primitives/AtlasType";
import { GenericType } from "../primitives/GenericType";

export type GenericTypeMap = Map<GenericType, AtlasType>;

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
