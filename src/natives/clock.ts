import { atlasNativeFn } from "../primitives/AtlasNativeFn";
import { AtlasNumber } from "../primitives/AtlasNumber";
import { Types } from "../primitives/AtlasType";

export const clock = atlasNativeFn(() => new AtlasNumber(Date.now() / 1000));

const clockType = Types.NativeFn.init({ params: [], returns: Types.Number });

export const clockValues = { clock };
export const clockTypes = { clock: clockType };
