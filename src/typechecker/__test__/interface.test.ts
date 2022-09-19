import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";

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
        bar: (Number) -> Null = f(num) {}
      
        foo = ""
      }
    `);

    expect(errors.length).toEqual(0);
  });

  it("infers class annotation assignments without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: () -> Null
        foo: String
      }
      
      class FooClass {
        bar: () -> Null = f() {}
      
        foo = ""
      }
      
      var foo: Foo = FooClass()
    `);

    expect(errors.length).toEqual(0);
  });

  it("infers record annotation assignments without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        bar: () -> Null
        foo: String
      }
      
      var foo: Foo = {
        "bar": f() {},
        "foo": ""
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

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Interface.init("Foo", {
          bar: Types.Function.init({
            params: [Types.Number],
            returns: Types.Null,
          }),
        }).toString(),
        Types.Class.init("FooClass", {
          bar: Types.Function.init({
            params: [],
            returns: Types.Null,
          }),
        }).toString()
      )
    );
  });

  it("errors with invalid subtype for records", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        foo: String
      }
      
      var foo: Foo = {
        "foo": 0
      }
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Interface.init("Foo", { foo: Types.String }).toString(),
        Types.Record.init({ foo: Types.Number }).toString()
      )
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

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Interface.init("Foo", { foo: Types.String }).toString(),
        Types.Class.init("FooBar", { foo: Types.Number }).toString()
      )
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

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Interface.init("Foo", { bar: Types.String }).toString(),
        Types.Class.init("BarClass", { bar: Types.Number }).toString()
      )
    );
  });
});
