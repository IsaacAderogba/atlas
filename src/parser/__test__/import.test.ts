import { describe, it, expect } from "vitest";

describe("Import statements", () => {
  it("parses import statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("import Foo from 'foo'");
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "import", type: "IMPORT" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
      modulePath: { lexeme: "'foo'", type: "STRING" },
    });
  });
});
