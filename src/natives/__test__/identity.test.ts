import { describe, it, expect } from "vitest";
import { Boolean } from "../../primitives/AtlasValue";

describe("identity", () => {
  it("tests `instanceOf` results", () => {
    const tests = [
      {
        source: "var x = instanceOf(true, Boolean)",
        variable: "x",
        value: true,
      },
      {
        source: "var x = instanceOf(false, Boolean)",
        variable: "x",
        value: true,
      },
      {
        source: "var x = instanceOf('false', Boolean)",
        variable: "x",
        value: false,
      },
    ];

    tests.forEach(({ source, variable, value }) => {
      const { tester } = setupTester();

      tester.interpretWorkflow(source);
      expect(tester.evaluateWorkflow(variable)).toMatchObject({ value });
    });
  });

  it("tests `type` results", () => {
    const tests = [
      {
        source: "var x = typeOf(true)",
        variable: "x",
        instance: Boolean,
      },
    ];

    tests.forEach(({ source, variable, instance }) => {
      const { tester } = setupTester();

      tester.interpretWorkflow(source);
      expect(tester.evaluateWorkflow(variable)).toMatchObject(instance);
    });
  });
});
