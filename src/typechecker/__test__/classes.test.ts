import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Class annotations", () => {
  it("annotates class statements without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
    class Foo {
      bar = "" // inferred
    
      init: (String) -> Instance = f(name) {
        this.bar = name // explicit
        this.create(this.bar)
      }
    
      create: (String) -> Null = f(name) {
        print("created " # name)
      }
    }
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Class errors", () => {
  it("errors with invalid subtype for field", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number = ""
      }
    `);

    const { error } = createSubtyper()(Types.String, Types.Number);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with invalid subtype for set operation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number = 0

        foo: () -> Null = f() {
          this.bar = ""
        }
      }
    `);

    const { error } = createSubtyper()(Types.String, Types.Number);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with invalid subtype for call expression", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      class Foo {
        bar: Number = 0

        foo: (Number) -> Null = f(num) {
          this.bar = num
        }
      }

      Foo().foo("")
    `);

    const { error } = createSubtyper()(Types.String, Types.Number);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
