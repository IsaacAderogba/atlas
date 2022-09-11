import { AtlasBoolean, atlasBoolean } from "../primitives/AtlasBoolean";
import { AtlasNativeFn } from "../primitives/AtlasNativeFn";
import { atlasNull } from "../primitives/AtlasNull";
import { AtlasValue, primitives } from "../primitives/AtlasValue";

export const isInstance = new AtlasNativeFn(
  (value: AtlasValue, atlasClass: AtlasValue): AtlasBoolean => {
    if (atlasClass.type !== "Class") return atlasBoolean(false);

    const currentClass = primitives[value.type];
    if (currentClass === atlasClass) return atlasBoolean(true);

    return atlasBoolean(false);
  }
);

const typeOf = new AtlasNativeFn(
  (value: AtlasValue) => primitives[value.type] ?? atlasNull()
);

export const identity = { typeOf, isInstance };
