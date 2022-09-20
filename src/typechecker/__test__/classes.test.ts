import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";

describe("Class annotations", () => {
  it("annotates class statements without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
    class Foo {
      bar = "" // inferred
    
      init: (String) -> this = f(name) {
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
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(Types.Number, Types.String)
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
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(Types.Number, Types.String)
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

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(Types.Number, Types.String)
    );
  });
});
