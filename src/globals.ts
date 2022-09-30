import { AtlasNumber } from "./primitives/AtlasNumber";
import { AtlasString } from "./primitives/AtlasString";
import { AtlasNativeFn } from "./primitives/AtlasNativeFn";
import { AtlasValue, Values } from "./primitives/AtlasValue";
import { AtlasType, Types } from "./primitives/AtlasType";

export const clock = new AtlasNativeFn(
  () => new AtlasNumber(Date.now() / 1000)
);

const clockType = Types.NativeFn.init({ params: [], returns: Types.Number });

export const print = new AtlasNativeFn(
  value => new AtlasString(value.toString())
);

print.call = (interpreter, args): AtlasValue => {
  const str = print.func(...args) as AtlasString;
  interpreter.atlas.reporter.log(str.value);
  return str;
};

const printType = Types.NativeFn.init({
  params: [Types.Any],
  returns: Types.String,
});

export const globals = {
  clock,
  print,
  ...Values,
};

export const typeGlobals: { [key: string]: AtlasType } = {
  clock: clockType,
  print: printType,
};
