import { Boolean } from "../../primitives/AtlasValue";

describe("identity", () => {
  it("tests `isInstance` results", () => {
    const tests = [
      {
        source: "var x = isInstance(true, Boolean)",
        variable: "x",
        value: true,
      },
      {
        source: "var x = isInstance(false, Boolean)",
        variable: "x",
        value: true,
      },
      {
        source: "var x = isInstance('false', Boolean)",
        variable: "x",
        value: false,
      },
    ];

    tests.forEach(({ source, variable, value }) => {
      const { tester } = setupTester();

      tester.interpret(source);
      expect(tester.evaluate(variable)).toMatchObject({ value });
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

      tester.interpret(source);
      expect(tester.evaluate(variable)).toMatchObject(instance);
    });
  });
});
