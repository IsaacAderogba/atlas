import { describe, expect, it } from "vitest";
import { RuntimeErrors } from "../../errors/RuntimeError";

describe("Module usage", () => {
  it("dot access module values without error", () => {
    const { tester } = setupTester();

    tester.interpretWorkflow(`
      module Mod {
        var foo = 3
      }

      var x = Mod.foo
    `);

    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "Number", value: 3 });
  });
});

describe("Module errors", () => {
  it("errors with undefined value if module attempts to use itself", () => {
    const { tester } = setupTester();

    const { errors } = tester.interpretWorkflow(`
      module Mod {
        var foo = 3
        var x = Mod.foo
      }
    `);

    expect(errors[0].sourceMessage).toEqual(
      RuntimeErrors.undefinedVariable("Mod")
    );
  });
});
