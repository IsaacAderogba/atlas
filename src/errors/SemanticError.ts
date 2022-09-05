import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class SemanticError implements SourceError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class SemanticErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `semantic ${type}: ` + title, body, type };
  }

  //
  static unusedVariable(): SourceMessage {
    return this.formatError({
      title: "unused variable",
      body: "variable was defined but never used",
      type: "warning",
    });
  }

  //
  static prohibitedVariableInitializer(): SourceMessage {
    return this.formatError({
      title: "prohbited variable initializer",
      body: "variable cannot reference the variable being initialized",
    });
  }

  static prohibitedRedeclaration(): SourceMessage {
    return this.formatError({
      title: "prohibited variable redeclaration",
      body: "existing variable cannot be redeclared",
    });
  }

  static prohibitedReturn(): SourceMessage {
    return this.formatError({
      title: "prohibited return",
      body: "return statement was used outside of the context of a function",
    });
  }

  static prohibitedBreak(): SourceMessage {
    return this.formatError({
      title: "prohibited break",
      body: "break statement was used outside of the context of a loop",
    });
  }

  static prohibitedContinue(): SourceMessage {
    return this.formatError({
      title: "prohibited continue",
      body: "continue statement was used outside of the context of a loop",
    });
  }
}
