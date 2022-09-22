import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Import annotations", () => {
  it("it infers stdlib imports without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      import Path from "path"
      
      Path.join("foo", "foo")
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Import errors", () => {
  it("errors with invalid subtype for incorrectly-used import", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      import Path from "path"
        
      Path.join(0, "")
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});


