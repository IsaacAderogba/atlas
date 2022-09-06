import { AtlasNumber } from "./AtlasNumber";
import { AtlasString } from "./AtlasString";
import { NativeFunction } from "./NativeFunction";

export const clock = new NativeFunction(
  () => new AtlasNumber(Date.now() / 1000)
);

export const print = new NativeFunction(value => {
  const str = value.toString();
  console.log(str);
  return new AtlasString(str);
});

export const globals = {
  clock,
  print,
};
