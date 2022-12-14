import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Class annotations", () => {
  it("annotates class set expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: String
      }

      Foo().bar = "hi"
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Class errors", () => {
  it("errors with invalid subtype for set expressions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number
      }

      Foo().bar = "hi"
    `);

    const { error } = createSubtyper()(Types.String, Types.Number);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with undefined property for set expressions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number
      }

      Foo().ho = "hi"
    `);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.unknownProperty("ho")
    );
  });
});
