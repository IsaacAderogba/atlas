import { AtlasType } from "../primitives/AtlasType";
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

  static invalidSubtype(body: string): SourceMessage {
    return this.formatError({
      title: "invalid subtype",
      body: body,
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

  static unexpectedCompositeOperator(): SourceMessage {
    return this.formatError({
      title: "unexpected composite operator",
      body: "",
    });
  }

  static unexpectedLogicalOperator(): SourceMessage {
    return this.formatError({ title: "unexpected logical operator", body: "" });
  }

  static mismatchedArity(expected: number, actual: number): SourceMessage {
    return this.formatError({
      title: "mismatched arity",
      body: `expected ${expected} arguments but got ${actual}`,
    });
  }

  static expectedCallableType(): SourceMessage {
    return this.formatError({
      title: "expected callable type",
      body: "callable type such as a function or method was expected",
    });
  }

  static prohibitedTypeRedeclaration(): SourceMessage {
    return this.formatError({
      title: "prohibited type redeclaration",
      body: "existing type cannot be redeclared",
    });
  }

  static requiredFunctionAnnotation(): SourceMessage {
    return this.formatError({
      title: "required function annotation",
      body: "callable annotations are required for functions",
    });
  }

  static requiredGenericArgs(): SourceMessage {
    return this.formatError({
      title: "required generic arguments",
      body: "generics usage always requires arguments",
    });
  }

  static undefinedType(type: string): SourceMessage {
    return this.formatError({
      title: "undefined type",
      body: `type "${type}" was used before it was defined`,
    });
  }

  static undefinedValue(name: string): SourceMessage {
    return this.formatError({
      title: "undefined value",
      body: `value "${name}" was used before it was defined`,
    });
  }

  static unknownProperty(name: string): SourceMessage {
    return this.formatError({
      title: "unknown property",
      body: `property ${name} cannot be inferred`,
    });
  }

  static requiredAnnotationOrInitializer(): SourceMessage {
    return this.formatError({
      title: "required annotation or initializer",
      body: `variables require either an explicit annotation or equals "=" initializer`,
    });
  }
}
