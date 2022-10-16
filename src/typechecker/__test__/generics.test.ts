import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Generics annotations", () => {
  it("annotates simple generics without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      type Foo[T] = T
      var foo: Foo[String] = ""
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates complex generics without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo[T] {
        foo: T
      }
      
      interface Bar[T] {
        bar: T
      }
      
      type FooBar[T] = Foo[Bar[T]]

      interface FooImplType {
        bar: Null
      }

      class FooImpl {
        bar: Null
      }

      class FooBarImpl implements FooBar[Null] {
        foo: FooImplType

        init: () -> Instance = f() {
          this.foo = FooImpl()
        }
      }
    `);

    expect(errors.length).toEqual(0);
  });

  it("supports multiple interface implementation with generics", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo[T] {
        foo: T
      }
      
      interface Bar[T] {
        bar: T
      }
      
      class FooBar implements Foo[Number] & Bar[String] {
        foo: Number
        bar: String
      }    
    `);

    expect(errors.length).toEqual(0);
  });

  it("supports operations using generic constraints", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      interface Foo[T] {
        foo: T
      }
      
      var addFoo: [T is Number](Foo[T]) -> Number = f(arg) {
        return arg.foo * arg.foo
      }
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Generic errors", () => {
  it("errors with required args for call expressions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var foo: [T, K](T, K) -> T = f(t, k) {
        return t	
      }	
              
      foo[String]()
    `);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.mismatchedArity(2, 1)
    );
  });

  it("errors with invalid subtype for incorrect type constraints", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      var foo: [K is Number](K) -> String = f(incorrect) {
        return "correct" # incorrect
      }
    `);

    const { error } = createSubtyper()(Types.Number, Types.String);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with required generics when invoking a generic function", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`      
      var addFoo: [T](T) -> Number = f(arg) {
        return 0
      }
              
      addFoo(6) 
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.requiredGenericArgs()
    );
  });

  it("errors with required generics when invoking a generic type", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`      
      type Foo[T] = T
      type Bar = Foo
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.requiredGenericArgs()
    );
  });

  it("always requires generic arguments for type constraints", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`      
      var addFoo: [T is Number](T) -> Number = f(arg) {
        return arg * arg
      }	   
              
      addFoo(6) 
    `);

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.requiredGenericArgs()
    );
  });
});
