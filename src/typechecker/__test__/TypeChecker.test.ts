import Types from "../../primitives/AtlasType";
import { describe, expect, it } from "vitest";

describe("Typechecker synthesis", () => {
  it("synthesizes numbers", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("4")).toEqual(Types.Number);
    expect(tester.evalTypeWorkflow("'4'")).not.toEqual(Types.Number);
  });

  it("synthesizes strings", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("'foo'")).toEqual(Types.String);
    expect(tester.evalTypeWorkflow("4")).not.toEqual(Types.String);
  });

  it("synthesizes booleans", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("true")).toEqual(Types.Boolean);
    expect(tester.evalTypeWorkflow("false")).toEqual(Types.Boolean);
    expect(tester.evalTypeWorkflow("4")).not.toEqual(Types.Boolean);
  });

  it("synthesizes null", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("null")).toEqual(Types.Null);
    expect(tester.evalTypeWorkflow("4")).not.toEqual(Types.Null);
  });
});
