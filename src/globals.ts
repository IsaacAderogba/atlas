import { AtlasNumber } from "./primitives/AtlasNumber";
import { AtlasString } from "./primitives/AtlasString";
import { AtlasNativeFn } from "./primitives/AtlasNativeFn";
import { primitives } from "./primitives/AtlasValue";
import { identity } from "./natives/identity";
import { AtlasType } from "./primitives/AtlasType";

export const clock = new AtlasNativeFn(
  () => new AtlasNumber(Date.now() / 1000)
);

export const print = new AtlasNativeFn(value => {
  const str = value.toString();
  console.log(str);
  return new AtlasString(str);
});

export const globals = {
  clock,
  print,
  ...identity,
  ...primitives,
};

export const typeGlobals: { [key: string]: AtlasType } = {};
