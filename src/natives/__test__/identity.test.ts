export {};
describe("identity", () => {
  it("determines whether one value is an instance of another", () => {
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
});
