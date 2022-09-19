import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";

describe("Interface annotations", () => {
  it("annotates intersections without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
    interface Foo {
      foo: String
    }
  
    interface Bar {
        bar: String
    }
    
    type FooBar = Foo & Bar
    
    var foobar: FooBar = {
        "foo": "string",
        "bar": "string"
    }
    `);

    expect(errors.length).toEqual(0);
  });

  it("implements intersections without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        foo: String
      }
    
      interface Bar {
          bar: String
      }
      
      type FooBar = Foo & Bar
      
      class FooBarClass implements FooBar {
          foo = ""
          bar = ""
      }
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Intersection errors", () => {
  it("errors with invalid subtype for impossible intersections", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      type Foo = String & Number

      var foo: Foo = ""
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Alias.init(
          "Foo",
          Types.Intersection.init([Types.String, Types.Number])
        ).toString(),
        Types.String.toString()
      )
    );
  });

  it("errors with invalid subtype when passing incorrect member to a function", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo {
        foo: String
      }

      interface Bar {
        bar: String
      }

      var func: (Foo & Bar) -> Null = f(arg) {

      }

      func({
        "foo": "foo"
      })
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        Types.Intersection.init([
          Types.Interface.init("Foo", { foo: Types.String }),
          Types.Interface.init("Bar", { foo: Types.String }),
        ]).toString(),
        Types.Record.init({ foo: Types.String }).toString()
      )
    );
  });
});
