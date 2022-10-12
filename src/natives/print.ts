import { atlasNativeFn } from "../primitives/AtlasNativeFn";
import { AtlasString } from "../primitives/AtlasString";
import { Types } from "../primitives/AtlasType";

export const print = atlasNativeFn((interpreter, value) => {
  const str = new AtlasString(value.toString());
  interpreter.atlas.reporter.log(str.value);
  return str;
});

const printType = Types.NativeFn.init({
  params: [Types.Any],
  returns: Types.String,
});

export const printValues = { print };
export const printTypes = { print: printType };
