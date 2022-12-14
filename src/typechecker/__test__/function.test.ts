import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Function annotations", () => {
  it("annotates functions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var foo: () -> String = f() {
        return ""
      }
    `);

    expect(errors.length).toEqual(0);
  });

  // callback
  it("infers function annotations without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      type Func = (String) -> String

      var foo: (Func) -> Null = f(func) {}
      
      foo(f(arg) {
          return ""
      })
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Function errors", () => {
  it("errors with invalid subtype for invalid function returns", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var foo: () -> String = f() {
        if (true) return 0
        return ""
      }
    `);

    const { error } = createSubtyper()(
      Types.Function.init({
        params: [],
        returns: Types.Union.init([Types.Number, Types.String]),
      }),
      Types.Function.init({ params: [], returns: Types.String }),
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
