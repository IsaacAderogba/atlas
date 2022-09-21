import { RequiredKeys } from "../utils/types";
import { SourceMessage } from "./SourceError";

export class NativeError extends Error {
  constructor(readonly sourceMessage: SourceMessage) {
    super(sourceMessage.title);
  }

  get message(): string {
    return this.sourceMessage.title;
  }
}

export class ReaderErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `reader ${type}: ` + title, body, type };
  }

  static invalidFilePath(path: string, message: string): SourceMessage {
    return this.formatError({
      title: "invalid file path",
      body: `Unable to open "${path}"${message ? `- ${message}` : ""}`,
    });
  }
}
