import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class SyntaxError extends Error implements SourceError {
  constructor(
    readonly sourceMessage: SourceMessage,
    readonly sourceRange: SourceRange
  ) {
    super(sourceMessage.title)
  }
}

export class SyntaxErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `syntax ${type}: ` + title, body, type };
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

  static expectedParameter(): SourceMessage {
    return this.formatError({
      title: "expected parameter",
      body: "a parameter name was expected",
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

  static invalidSemiColon(): SourceMessage {
    return this.formatError({
      title: "invalid semicolon",
      body: 'this semicolon ";" usage is invalid',
    });
  }

  static expectedColon(): SourceMessage {
    return this.formatError({
      title: "expected colon",
      body: 'a colon ":" was expected',
    });
  }

  static expectedLeftParen(): SourceMessage {
    return this.formatError({
      title: "expected left parenthesis",
      body: 'a left parenthesis "(" was expected',
    });
  }

  static expectedLeftBrace(): SourceMessage {
    return this.formatError({
      title: "expected left brace",
      body: 'a left brace "{" was expected',
    });
  }

  static expectedRightParen(): SourceMessage {
    return this.formatError({
      title: "expected right parenthesis",
      body: 'a right parenthesis ")" was expected',
    });
  }

  static expectedRightBrace(): SourceMessage {
    return this.formatError({
      title: "expected right brace",
      body: 'a right brace "}" was expected',
    });
  }

  static expectedRightBracket(): SourceMessage {
    return this.formatError({
      title: "expected right bracket",
      body: 'a right bracket "]" was expected',
    });
  }

  static expectedRightCaret(): SourceMessage {
    return this.formatError({
      title: "expected right caret",
      body: 'a right caret ">" was expected',
    });
  }

  static expectedDash(): SourceMessage {
    return this.formatError({
      title: "expected dash",
      body: 'a dash "-" was expected',
    });
  }

  static expectedBacktick(): SourceMessage {
    return this.formatError({
      title: "expected backtick",
      body: 'a backtick "`" was expected',
    });
  }

  static expectedExpression(): SourceMessage {
    return this.formatError({
      title: "expected expression",
      body: "an expression was expected",
    });
  }

  static expectedString(): SourceMessage {
    return this.formatError({
      title: "expected string",
      body: "a strin was expected",
    });
  }

  static expectedLeftOperand(): SourceMessage {
    return this.formatError({
      title: "expected left operand",
      body: "a left-hand side operand was expected",
    });
  }
}
