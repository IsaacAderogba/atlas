import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";

describe("Module annotations", () => {
  it("dot access module types without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      module Mod {
        type Foo[T] = T
      }

      var foo: Mod.Foo[String] = ""
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Module errors", () => {
  it("errors with undefined type if module attempts to use itself", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      module Mod {
        type Foo[T] = T
      
        var foo: Mod.Foo[String] = ""
      }
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.undefinedType("Mod")
    );
  });
});
