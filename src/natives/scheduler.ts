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

  interpreter.scheduler.queueTask(() => callback.call(interpreter, []));
  return atlasNull();
});

const scheduleTaskType = Types.NativeFn.init({
  params: [Types.Function.init({ params: [], returns: Types.Null })],
  returns: Types.Null,
});

export const runScheduledTasks = new AtlasNativeFn(interpreter => {
  interpreter.scheduler.run();
  return atlasNull();
});

const runScheduledTasksType = Types.NativeFn.init({
  params: [],
  returns: Types.Null,
});

export const schedulerValues = { scheduleTask, runScheduledTasks };
export const schedulerTypes = {
  scheduleTask: scheduleTaskType,
  runScheduledTasks: runScheduledTasksType,
};
