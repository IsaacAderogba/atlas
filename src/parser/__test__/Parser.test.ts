import { Errors } from "../../utils/Errors";
import { Parser } from "../Parser";
import { Scanner } from "../Scanner";

const setupTests = (source: string): { parser: Parser } => {
  const scanner = new Scanner(source);
  const { tokens } = scanner.scanTokens();
  const parser = new Parser(tokens);

  return { parser };
};

describe("Parser errors", () => {
  it("errors with expected colon", () => {
    const { parser } = setupTests("4 == 4 ? 3");

    const { errors } = parser.parse();
    expect(errors[0].message).toEqual(Errors.ExpectedColon);
  });

  it("errors with expected right paren", () => {
    const { parser } = setupTests("( 4 + 4");

    const { errors } = parser.parse();
    expect(errors[0].message).toEqual(Errors.ExpectedRightParen);
  });

  it("errors with expected left operand", () => {
    const expressions = ["!= 4", "== 4", "> 4", ">= 4", "< 4", "<= 4", "+ 4", "/ 4", "* 4"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toEqual(Errors.ExpectedLeftOperand);
    });
  });

  it("errors with expected expression", () => {
    const { parser } = setupTests("4 +");

    const { errors } = parser.parse();
    expect(errors[0].message).toEqual(Errors.ExpectedExpression);
  });
});
