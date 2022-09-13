import Types from "../../primitives/AtlasType";
import { describe, expect, it } from "vitest";

describe("Typechecker expressions", () => {
  it("evaluates any", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Any)).toEqual(false);
  });

  it("evaluates numbers", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Number)).toEqual(true);
    expect(tester.evalTypeWorkflow("'4'").isSubtype(Types.Number)).toEqual(
      false
    );
  });

  it("evaluates strings", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("'foo'").isSubtype(Types.String)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.String)).toEqual(false);
  });

  it("evaluates booleans", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("true").isSubtype(Types.Boolean)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("false").isSubtype(Types.Boolean)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Boolean)).toEqual(
      false
    );
  });

  it("evaluates null", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("null").isSubtype(Types.Null)).toEqual(true);
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Null)).toEqual(false);
  });

  it("evaluates unary expressions", () => {
    const types = [
      { source: "!!true", subtype: Types.Boolean },
      { source: "-5", subtype: Types.Number },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();

      expect(tester.evalTypeWorkflow(source).isSubtype(subtype)).toEqual(true);
    });
  });
});
