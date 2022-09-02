import { SourceMessage, SourceRange } from "../utils/Source";

export class SyntaxError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class SyntaxErrors {
  static formatError({ title, body }: SourceMessage): SourceMessage {
    return { title: "syntax error: " + title, body };
  }

  //
  static unterminatedString(): SourceMessage {
    return this.formatError({
      title: "unterminated string",
      body: "a string must be terminated with a closing quotation mark",
    });
  }

  static unsupportedCharacter(): SourceMessage {
    return this.formatError({
      title: "unsupported character",
      body: "this source character is not supported by the interpreter",
    });
  }

  //
  static expectedIdentifier(): SourceMessage {
    return this.formatError({ title: "expected identifier", body: "" });
  }

  static expectedAssignment(): SourceMessage {
    return this.formatError({ title: "expected assignment", body: "" });
  }

  static expectedSemiColon(): SourceMessage {
    return this.formatError({ title: "expected semicolon", body: "" });
  }

  static expectedColon(): SourceMessage {
    return this.formatError({ title: "expected colon", body: "" });
  }

  static expectedRightParen(): SourceMessage {
    return this.formatError({ title: "expected right parenthesis", body: "" });
  }

  static expectedExpression(): SourceMessage {
    return this.formatError({ title: "expected expression", body: "" });
  }

  static expectedLeftOperand(): SourceMessage {
    return this.formatError({ title: "expected left operand", body: "" });
  }
}
