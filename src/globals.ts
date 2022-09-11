import { AtlasNumber } from "./primitives/AtlasNumber";
import { AtlasString } from "./primitives/AtlasString";
import { AtlasNativeFn } from "./primitives/AtlasNativeFn";
import {
  Boolean,
  Null,
  Number,
  String,
  Function,
  Class,
  List,
  Record,
} from "./primitives/AtlasValue";

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
  Boolean,
  Null,
  Number,
  String,
  Function,
  Class,
  List,
  Record,
};
