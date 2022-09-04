import { AtlasNull } from "./AtlasNull";
import { AtlasNumber } from "./AtlasNumber";
import { NativeFunction } from "./NativeFunction";

export const clock = new NativeFunction(
  () => new AtlasNumber(Date.now() / 1000)
);

export const print = new NativeFunction(value => {
  console.log(value.toString());
  return new AtlasNull();
});

export const globals = {
  clock,
  print,
};
