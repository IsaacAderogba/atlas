import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class TypeCheckError implements SourceError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class TypeCheckErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `type ${type}: ` + title, body, type };
  }
}
