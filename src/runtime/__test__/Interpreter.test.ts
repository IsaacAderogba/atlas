import { Parser } from "../../parser/Parser";
import { Scanner } from "../../parser/Scanner";
import { Errors } from "../../utils/Errors";
import { Interpreter } from "../Interpreter";

const setupTests = (
  source: string
): {
  interpret: () => ReturnType<Interpreter["interpret"]>;
  evaluate: () => ReturnType<Interpreter["evaluate"]>;
} => {
  const scanner = new Scanner(source);
  const { tokens, errors: scanErrs } = scanner.scan();

  if (scanErrs.length) {
    console.log("Scan errors", scanErrs);
    throw new Error("Scan failed");
  }

  const parser = new Parser(tokens);
  const { expression, errors: parseErrs } = parser.parse();

  if (!expression || parseErrs.length) {
    console.log("Parse errors", parseErrs);
    throw new Error("Parse failed");
  }

  const interpreter = new Interpreter();

  return {
    interpret: () => interpreter.interpret(expression),
    evaluate: () => interpreter.evaluate(expression),
  };
};

describe("Interpreter errors", () => {
  it("errors with expected number", () => {
    const sources = [
      "-'4'",
      "4 + '4'",
      "4 - '4'",
      "4 / '4'",
      "4 * '4'",
      "4 > '4'",
      "4 >= '4'",
      "4 < '4'",
      "4 <= '4'",
    ];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toContain(Errors.ExpectedNumber);
    });
  });

  it("errors with expected boolean", () => {
    const sources = ["!'4'", "4 ? true : false"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toContain(Errors.ExpectedBoolean);
    });
  });
});
