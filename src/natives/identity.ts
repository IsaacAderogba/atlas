import { AtlasBoolean, atlasBoolean } from "../primitives/AtlasBoolean";
import { AtlasNativeFn } from "../primitives/AtlasNativeFn";
import { atlasNull } from "../primitives/AtlasNull";
import { Types } from "../primitives/AtlasType";
import { AtlasValue, primitives } from "../primitives/AtlasValue";

const isInstance = new AtlasNativeFn(
  (value: AtlasValue, atlasClass: AtlasValue): AtlasBoolean => {
    if (atlasClass.type !== "Class") return atlasBoolean(false);

    const currentClass = primitives[value.type];
    if (currentClass === atlasClass) return atlasBoolean(true);

    return atlasBoolean(false);
  }
);

const isInstanceType = Types.NativeFn.init({
  params: [Types.Any, Types.Any],
  returns: Types.Boolean,
});

const typeOf = new AtlasNativeFn(
  (value: AtlasValue) => primitives[value.type] ?? atlasNull()
);

const typeOfType = Types.NativeFn.init({
  params: [Types.Any],
  returns: Types.Any,
});

export const identity = { typeOf, isInstance };
export const identityTypes = { isInstance: isInstanceType, typeOf: typeOfType };
