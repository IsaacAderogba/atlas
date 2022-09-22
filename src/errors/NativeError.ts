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

export const isNativeError = (value: unknown): value is NativeError =>
  value instanceof NativeError;

export class NativeErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `native ${type}: ` + title, body, type };
  }

  static invalidFilePath(path: string, message = ""): SourceMessage {
    return this.formatError({
      title: "invalid file path",
      body: `unable to read "${path}"${message ? `\n${message}` : ""}`,
    });
  }
}
