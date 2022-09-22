import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("List annotations", () => {
  it("infers list expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var list = [""]
      list.add("")
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates list expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var list: List[String] = []
      list.add("")
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("List errors", () => {
  it("errors if list inference doesn't satisfy list annotation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var list: List[String] = [0]
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors if any element in list doesn't satisfy list annotation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var list: List[String] = ["", 0]
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors if attempts to add a type that doesn't support list inference", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var list = ["", 0]
      list.add(null)
    `);

    const { error } = createSubtyper()(
      Types.Null,
      Types.Union.init([Types.String, Types.Number])
    );

    console.log(
      "message",
      errors[0].sourceMessage,
      TypeCheckErrors.invalidSubtype(error)
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
