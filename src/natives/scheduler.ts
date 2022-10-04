import { NativeError } from "../errors/NativeError";
import { RuntimeErrors } from "../errors/RuntimeError";
import { isAtlasFunction } from "../primitives/AtlasFunction";
import { AtlasNativeFn } from "../primitives/AtlasNativeFn";
import { atlasNull } from "../primitives/AtlasNull";
import { Types } from "../primitives/AtlasType";

export const scheduleTask = new AtlasNativeFn((interpreter, callback) => {
  if (!isAtlasFunction(callback)) {
    throw new NativeError(RuntimeErrors.expectedFunction());
  }

  interpreter.scheduler.queueTask(() => callback.call(interpreter, []))
  return atlasNull();
});

const scheduleTaskType = Types.NativeFn.init({
  params: [Types.Function],
  returns: Types.Function,
});

export const schedulerValues = { scheduleTask };
export const schedulerTypes = { scheduler: scheduleTaskType };
