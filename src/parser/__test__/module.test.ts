import { describe, it, expect } from "vitest";

describe("Module statements", () => {
  it("parses module statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("module Foo { }");
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "module", type: "MODULE" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
    });
  });
});
