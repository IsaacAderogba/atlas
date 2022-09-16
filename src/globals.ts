import { AtlasNumber } from "./primitives/AtlasNumber";
import { AtlasString } from "./primitives/AtlasString";
import { AtlasNativeFn } from "./primitives/AtlasNativeFn";
import { Values } from "./primitives/AtlasValue";
import { identity, identityTypes } from "./natives/identity";
import { AtlasType, Types } from "./primitives/AtlasType";

export const clock = new AtlasNativeFn(
  () => new AtlasNumber(Date.now() / 1000)
);

const clockType = Types.NativeFn.init({ params: [], returns: Types.Number });

export const print = new AtlasNativeFn(value => {
  const str = value.toString();
  console.log(str);
  return new AtlasString(str);
});

const printType = Types.NativeFn.init({
  params: [Types.Any],
  returns: Types.String,
});

export const globals = {
  clock,
  print,
  ...identity,
  ...Values,
};

export const typeGlobals: { [key: string]: AtlasType } = {
  clock: clockType,
  print: printType,
  ...identityTypes,
};
