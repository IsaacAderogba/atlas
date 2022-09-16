import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";

describe("Class annotations", () => {
  it("annotates class set expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar = ""
      }

      Foo().bar = "hi"
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates record set expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var foo = {
        "bar": ""
      }

      foo.bar = "hi"
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Class errors", () => {
  it("errors with invalid subtype for set expressions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number = 0
      }

      Foo().bar = "hi"
    `);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Number.toString(),
        Types.String.toString()
      )
    );
  });

  it("errors with undefined property for set expressions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number = 0
      }

      Foo().ho = "hi"
    `);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.undefinedProperty("ho")
    );
  });
});