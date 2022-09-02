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

  static invalidAssignmentTarget(): SourceMessage {
    return this.formatError({
      title: "invalid assignment target",
      body: "left-hand side of an assignment must be valid",
    });
  }

  //
  static expectedIdentifier(): SourceMessage {
    return this.formatError({
      title: "expected identifier",
      body: "a variable name was expected",
    });
  }

  static expectedAssignment(): SourceMessage {
    return this.formatError({
      title: "expected assignment",
      body: 'an assignment operator "=" was expected',
    });
  }

  static expectedSemiColon(): SourceMessage {
    return this.formatError({
      title: "expected semicolon",
      body: 'a semicolon ";" was expected',
    });
  }

  static expectedColon(): SourceMessage {
    return this.formatError({
      title: "expected colon",
      body: 'a colon ":" was expected',
    });
  }

  static expectedRightParen(): SourceMessage {
    return this.formatError({
      title: "expected right parenthesis",
      body: 'a right parenthesis ")" was expected',
    });
  }

  static expectedExpression(): SourceMessage {
    return this.formatError({
      title: "expected expression",
      body: "an expression that evaluates to a value was expected",
    });
  }

  static expectedLeftOperand(): SourceMessage {
    return this.formatError({
      title: "expected left operand",
      body: "a left-hand side operand was expected",
    });
  }
}