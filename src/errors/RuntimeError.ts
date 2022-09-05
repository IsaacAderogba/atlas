import { RequiredKeys } from "../utils/types";
import { SourceError, SourceMessage, SourceRange } from "./SourceError";

export class RuntimeError implements SourceError {
  constructor(
    readonly message: SourceMessage,
    readonly sourceRange: SourceRange
  ) {}
}

export class RuntimeErrors {
  static formatError({
    title,
    body = "",
    type = "error",
  }: RequiredKeys<SourceMessage, "title">): SourceMessage {
    return { title: `runtime ${type}: ` + title, body, type };
  }

  //
  static undefinedVariable(name: string): SourceMessage {
    return this.formatError({
      title: "undefined variable",
      body: `the variable "${name}" was used before it was defined`,
    });
  }

  static unresolvedVariable(name: string, distance: number): SourceMessage {
    return this.formatError({
      title: "unresolved variable",
      body: `unable to find variable "${name}" at environment distance ${distance}`,
    });
  }

  //
  static prohibitedZeroDivision(): SourceMessage {
    return this.formatError({
      title: "prohibited division by zero",
      body: "prohibited attempt to divide by zero",
    });
  }

  static mismatchedArity(expected: number, actual: number): SourceMessage {
    return this.formatError({
      title: "mismatched arity",
      body: `expected ${expected} arguments but got ${actual}`,
    });
  }

  //
  static unexpectedBinaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected binary operator", body: "" });
  }

  static unexpectedUnaryOperator(): SourceMessage {
    return this.formatError({ title: "unexpected unary operator", body: "" });
  }

  static unexpectedLogicalOperator(): SourceMessage {
    return this.formatError({ title: "unexpected logical operator", body: "" });
  }

  //
  static expectedString(): SourceMessage {
    return this.formatError({
      title: "expected string",
      body: "a string was expected",
    });
  }

  static expectedNumber(): SourceMessage {
    return this.formatError({
      title: "expected number",
      body: "a number was expected",
    });
  }

  static expectedBoolean(): SourceMessage {
    return this.formatError({
      title: "expected boolean",
      body: "a boolean was expected",
    });
  }

  static expectedCallable(): SourceMessage {
    return this.formatError({
      title: "expected callable",
      body: "a function or class was expected",
    });
  }
}
