import { AtlasClass } from "../primitives/AtlasClass";
import { AtlasNativeFn, toNativeFunctions } from "../primitives/AtlasNativeFn";

export const expect = new AtlasNativeFn((interpreter, actual) => {
  const Matcher = new AtlasClass("Matcher", toNativeFunctions({}));

  return Matcher.call(interpreter, []);
});
