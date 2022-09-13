import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class TypeCheckError extends Error implements SourceError {
  constructor(
    readonly sourceMessage: SourceMessage,
    readonly sourceRange: SourceRange
  ) {
    super(sourceMessage.title);
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

  static invalidSubtype(
    expectedType: string,
    foundType: string
  ): SourceMessage {
    return this.formatError({
      title: "invalid subtype",
      body: `expected type "${expectedType}", but got type "${foundType}"`,
    });
  }

  static unexpectedLiteralType(type: string): SourceMessage {
    return this.formatError({
      title: "unexpected literal type",
      body: `cannot process expression with type "${type}"`,
    });
  }

  static unexpectedUnaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected unary operator", body: "" });
  }

  static unexpectedBinaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected unary operator", body: "" });
  }

  static unexpectedLogicalOperator(): SourceMessage {
    return this.formatError({ title: "unexpected logical operator", body: "" });
  }

  static prohibitedTypeRedeclaration(): SourceMessage {
    return this.formatError({
      title: "prohibited type redeclaration",
      body: "existing type cannot be redeclared",
    });
  }

  static undefinedType(type: string): SourceMessage {
    return this.formatError({
      title: "undefined type",
      body: `type "${type}" has not been defined`,
    });
  }

  static unusedType(): SourceMessage {
    return this.formatError({
      title: "unused type",
      body: "type was defined but never used",
      type: "warning",
    });
  }
}
