import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class TypeCheckError extends Error implements SourceError {
  constructor(
    readonly sourceMessage: SourceMessage,
    readonly sourceRange: SourceRange
  ) {
    super(sourceMessage.title)
  }
}

export class TypeCheckErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `type ${type}: ` + title, body, type };
  }

  static unexpectedLiteralType(type: string): SourceMessage {
    return this.formatError({
      title: "unexpected literal type",
      body: `cannot process expression with type "${type}"`,
    });
  }
}
