import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Interface annotations", () => {
  it("annotates interface statements without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: () -> Null
        foo: String
      }
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates valid interface subtypes without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: String
      }
      
      class FooClass implements Foo {
        bar: String = ""
      }
      
      class BarClass {
        bar: String = ""
      }
      
      var func: (Foo) -> Null = f(fooLike) {}
      
      func(BarClass())
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates interface implementations without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: (Number) -> Null
      }
      
      class FooClass implements Foo {
        bar: (Number) -> Null
        foo: String
      }
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Interface errors", () => {
  it("errors with invalid subtype for class", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: (Number) -> Null
      }
      
      class FooClass {
        bar: () -> Null = f() {}
      }
      
      var foo: Foo = FooClass()
    `);

    const { error } = createSubtyper()(
      Types.Class.init("FooClass", {
        bar: Types.Function.init({
          params: [],
          returns: Types.Null,
        }),
      }),
      Types.Interface.init("Foo", {
        bar: Types.Function.init({
          params: [Types.Number],
          returns: Types.Null,
        }),
      })
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with invalid subtype for interface implementations", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        foo: String
      }
      
      class FooBar implements Foo {
        foo: Number = 0
      }
    `);

    const { error } = createSubtyper()(
      Types.Class.init("FooBar", { foo: Types.Number }),
      Types.Interface.init("Foo", { foo: Types.String })
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with invalid subtype for function annotations", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: String
      }
      
      class FooClass implements Foo {
        bar: String = ""
      }
      
      class BarClass {
        bar: Number = 0
      }
      
      var func: (Foo) -> Null = f(fooLike) {}
      
      func(BarClass())
    `);

    const { error } = createSubtyper()(
      Types.Class.init("BarClass", { bar: Types.Number }),
      Types.Interface.init("Foo", { bar: Types.String })
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
