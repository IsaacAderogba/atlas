import { Values } from "./primitives/AtlasValue";
import { AtlasType, ValueTypes } from "./primitives/AtlasType";
import { printTypes, printValues } from "./natives/print";
import { clockTypes, clockValues } from "./natives/clock";
import { schedulerTypes, schedulerValues } from "./natives/scheduler";

export const globals = {
  ...clockValues,
  ...printValues,
  ...schedulerValues,
  ...Values,
};

export const globalTypes: { [key: string]: AtlasType } = {
  ...clockTypes,
  ...printTypes,
  ...schedulerTypes,
  ...ValueTypes,
};
