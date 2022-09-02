import { SourceMessage, SourceRange } from "../utils/Source";

export class RuntimeError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class RuntimeErrors {
  //
  static undefinedVariable(): SourceMessage {
    return { title: "undefined variable", body: "" };
  }

  //
  static prohibitedZeroDivision(): SourceMessage {
    return { title: "prohibited division by zero", body: "" };
  }

  //
  static unexpectedBinaryOperator(): SourceMessage {
    return { title: "unexpected binary operator", body: "" };
  }

  static unexpectedUnaryOperator(): SourceMessage {
    return { title: "unexpected unary operator", body: "" };
  }

  //
  static expectedNumber(): SourceMessage {
    return { title: "expected number", body: "" };
  }

  static expectedBoolean(): SourceMessage {
    return { title: "expected boolean", body: "" };
  }
}
