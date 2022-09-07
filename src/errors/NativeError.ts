import { SourceMessage } from "./SourceError";

export class NativeError {
  constructor(readonly message: SourceMessage) {}
}
