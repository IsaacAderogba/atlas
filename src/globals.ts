import { Values } from "./primitives/AtlasValue";
import { AtlasType, ValueTypes } from "./primitives/AtlasType";
import { printTypes, printValues } from "./natives/print";
import { clockTypes, clockValues } from "./natives/clock";

export const globals = {
  ...clockValues,
  ...printValues,
  ...Values,
};

export const globalTypes: { [key: string]: AtlasType } = {
  ...clockTypes,
  ...printTypes,
  ...ValueTypes,
};
