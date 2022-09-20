import { describe, it, expect } from "vitest";

describe("Namespace statements", () => {
  it("parses namespace statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("namespace Foo { }");
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "namespace", type: "NAMESPACE" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
    });
  });
});
