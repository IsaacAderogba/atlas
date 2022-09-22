import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Record annotations", () => {
  it("infers record expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var record = { "key": 0 }
      record.put("key", 2)
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates record expressions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var record: Record[String] = { }
      record.put("key", "2")
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Record errors", () => {
  it("errors if record inference doesn't satisfy list annotation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var record: Record[String] = { "key": 0 }
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors if any element in record doesn't satisfy record annotation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var record: Record[String] = {
        "key": "",
        "key": 0
      }
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors if attempts to add a type that doesn't support list inference", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var record = {
        "key": "",
        "key": 0
      }
      record.put("key", null)
    `);

    const { error } = createSubtyper()(
      Types.Null,
      Types.Union.init([Types.String, Types.Number])
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
