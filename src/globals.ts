import { AtlasNumber } from "./primitives/AtlasNumber";
import { AtlasNativeFn } from "./primitives/AtlasNativeFn";
import { Values } from "./primitives/AtlasValue";
import { AtlasType, Types } from "./primitives/AtlasType";
import { printTypes, printValues } from "./natives/print";

export const clock = new AtlasNativeFn(
  () => new AtlasNumber(Date.now() / 1000)
);

const clockType = Types.NativeFn.init({ params: [], returns: Types.Number });

export const globals = {
  clock,
  ...printValues,
  ...Values,
};

export const typeGlobals: { [key: string]: AtlasType } = {
  clock: clockType,
  ...printTypes,
};
