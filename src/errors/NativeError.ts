import { SourceMessage } from "./SourceError";

export class NativeError extends Error {
  constructor(readonly sourceMessage: SourceMessage) {
    super(sourceMessage.title);
  }

  get message(): string {
    return this.sourceMessage.title;
  }
}
