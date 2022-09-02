import { RuntimeErrors } from "../../errors/RuntimeError";
import { Parser } from "../../parser/Parser";
import { Scanner } from "../../parser/Scanner";
import { ConsoleReporter } from "../../reporter/ConsoleReporter";
import { Interpreter } from "../Interpreter";

interface SetupTests {
  interpret: () => ReturnType<Interpreter["interpret"]>;
  evaluate: () => ReturnType<Interpreter["evaluate"]>;
}

const setupTests = (source: string): SetupTests => {
  const scanner = new Scanner(source);
  const { tokens, errors: scanErrs } = scanner.scan();

  if (scanErrs.length) {
    console.log("Scan errors", scanErrs);
    throw new Error("Scan failed");
  }

  const parser = new Parser(tokens);
  const interpreter = new Interpreter({ reporter: new ConsoleReporter() });

  const setup: SetupTests = {
    interpret: () => {
      const { statements, errors: parseErrs } = parser.parse();

      if (!statements || parseErrs.length) {
        console.log("Parse errors", parseErrs);
        throw new Error("Parse failed");
      }
      return interpreter.interpret(statements);
    },
    evaluate: () => {
      return interpreter.evaluate(parser.expression());
    },
  };

  return setup;
};

describe("Interpreter evaluations", () => {
  it("evaluates ternary expression", () => {
    const tests = [
      { source: "true ? true : false", object: { value: true } },
      { source: "false ? true : false", object: { value: false } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates binary expressions", () => {
    const tests = [
      { source: "4 + 4", object: { value: 8 } },
      { source: "4 - 4", object: { value: 0 } },
      { source: "4 / 4", object: { value: 1 } },
      { source: "4 * 4", object: { value: 16 } },
      { source: "4 > 4", object: { value: false } },
      { source: "4 >= 4", object: { value: true } },
      { source: "4 < 4", object: { value: false } },
      { source: "4 <= 4", object: { value: true } },
      { source: "4 != 4", object: { value: false } },
      { source: "4 == 4", object: { value: true } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates unary expressions", () => {
    const tests = [
      { source: "!true", object: { value: false } },
      { source: "-4", object: { value: -4 } },
      { source: "--4", object: { value: 4 } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates literal expressions", () => {
    const tests = [
      { source: "true", object: { value: true } },
      { source: "false", object: { value: false } },
      { source: "4", object: { value: 4 } },
      { source: "null", object: { value: null } },
      { source: "'string'", object: { value: "string" } },
      { source: '"string"', object: { value: "string" } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates grouping expressions", () => {
    const tests = [
      { source: "4 + 4 * 4", object: { value: 20 } },
      { source: "(4 + 4) * 4", object: { value: 32 } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });
});

describe("Interpreter errors", () => {
  it("errors with expected number", () => {
    const sources = [
      "-'4';",
      "4 + '4';",
      "4 - '4';",
      "4 / '4';",
      "4 * '4';",
      "4 > '4';",
      "4 >= '4';",
      "4 < '4';",
      "4 <= '4';",
    ];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedNumber());
    });
  });

  it("errors with expected boolean", () => {
    const sources = ["!'4';", "4 ? true : false;"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedBoolean());
    });
  });

  it("errors with prohibited zero division", () => {
    const sources = ["4 / 0;"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(
        RuntimeErrors.prohibitedZeroDivision()
      );
    });
  });
});
