import { AtlasNumber } from "./interpreter/AtlasNumber";
import { AtlasString } from "./interpreter/AtlasString";
import { NativeFunction } from "./interpreter/NativeFunction";
import { Boolean } from "./interpreter/AtlasValue";

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
  Boolean
};
