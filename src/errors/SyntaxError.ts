import { SourceMessage, SourceRange } from "../utils/Source";

export class SyntaxError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class SyntaxErrors {
  //
  static unterminatedString(): SourceMessage {
    return { title: "unterminated string", body: "" };
  }

  static unexpectedCharacter(): SourceMessage {
    return { title: "unexpected character", body: "" };
  }

  //
  static expectedIdentifier(): SourceMessage {
    return { title: "expected identifier", body: "" };
  }

  static expectedAssignment(): SourceMessage {
    return { title: "expected assignment", body: "" };
  }

  static expectedSemiColon(): SourceMessage {
    return { title: "expected semicolon", body: "" };
  }

  static expectedColon(): SourceMessage {
    return { title: "expected colon", body: "" };
  }

  static expectedRightParen(): SourceMessage {
    return { title: "expected right parenthesis", body: "" };
  }

  static expectedExpression(): SourceMessage {
    return { title: "expected expression", body: "" };
  }

  static expectedLeftOperand(): SourceMessage {
    return { title: "expected left operand", body: "" };
  }
}
