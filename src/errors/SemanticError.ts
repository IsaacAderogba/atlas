import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class SemanticError implements SourceError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class SemanticErrors {
  static formatError({ title, body }: SourceMessage): SourceMessage {
    return { title: "semantic error: " + title, body };
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
