import { AtlasNativeFn } from "../primitives/AtlasNativeFn";
import { AtlasString } from "../primitives/AtlasString";
import { Types } from "../primitives/AtlasType";
import { AtlasValue } from "../primitives/AtlasValue";

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

export const printValues = { print };
export const printTypes = { print: printType };
