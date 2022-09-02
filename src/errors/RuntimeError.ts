import { SourceMessage, SourceRange } from "../utils/Source";

export class RuntimeError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class RuntimeErrors {
  static formatError({ title, body }: SourceMessage): SourceMessage {
    return { title: "runtime error: " + title, body };
  }

  //
  static undefinedVariable(): SourceMessage {
    return this.formatError({ title: "undefined variable", body: "" });
  }

  //
  static prohibitedZeroDivision(): SourceMessage {
    return this.formatError({ title: "prohibited division by zero", body: "" });
  }

  //
  static unexpectedBinaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected binary operator", body: "" });
  }

  static unexpectedUnaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected unary operator", body: "" });
  }

  //
  static expectedNumber(): SourceMessage {
    return this.formatError({ title: "expected number", body: "" });
  }

  static expectedBoolean(): SourceMessage {
    return this.formatError({ title: "expected boolean", body: "" });
  }
}
