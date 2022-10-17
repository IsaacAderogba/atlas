import { atlasNativeFn } from "../primitives/AtlasNativeFn";
import { atlasString } from "../primitives/AtlasString";
import { Types } from "../primitives/AtlasType";

export const print = atlasNativeFn((interpreter, value) => {
  const str = atlasString(value.toString());
  interpreter.atlas.reporter.log(str.value);
  return str;
});

const printType = Types.NativeFn.init({
  params: [Types.Any],
  returns: Types.String,
});

export const printValues = { print };
export const printTypes = { print: printType };
