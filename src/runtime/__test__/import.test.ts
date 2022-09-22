import { describe, expect, it } from "vitest";

describe("Import usage", () => {
  it("uses stdlib imports without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.interpretWorkflow(`
      import Path from "path"
      Path.join("foo", "foo")
    `);

    expect(errors.length).toEqual(0);
  });
});
