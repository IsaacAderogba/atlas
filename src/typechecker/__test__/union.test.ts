import { describe, expect, it } from "vitest";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { Types } from "../../primitives/AtlasType";
import { createSubtyper } from "../isSubtype";

describe("Interface annotations", () => {
  it("annotates simple unions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      type Foo = String | Number
      var foo: Foo = ""
    `);

    expect(errors.length).toEqual(0);
  });

  it("annotates complex unions without error", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
        interface CartesianVector {
          type: String
          x: Number
          y: Number
        }
        
        interface PolarVector {
          type: String
          angle: Number
          magnitude: Number
        }
        
        type Vector = CartesianVector | PolarVector
        
        var vector: Vector = { 
          "type": "cartesian", 
          "angle": 0, 
          "magnitude": 0 
        }
    `);

    expect(errors.length).toEqual(0);
  });
});

describe("Union errors", () => {
  it("errors with invalid subtype for non-chosen union member", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
      type Foo = String | Number

      var foo: Foo = null
    `);

    const { error } = createSubtyper()(
      Types.Null,
      Types.Alias.init("Foo", Types.Union.init([Types.String, Types.Number]))
    );
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors with invalid subtype when passing incorrect member to a function", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
        type Foo = String | Number

        var func: (Foo) -> Null = f(foo) {
        
        }
        
        func(null)
    `);

    const { error } = createSubtyper()(
      Types.Null,
      Types.Alias.init("Foo", Types.Union.init([Types.String, Types.Number]))
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });

  it("errors for invalid annotations of complex unions", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
        interface CartesianVector {
          y: Number
        }
        
        interface PolarVector {
          angle: Number
        }
        
        type Vector = CartesianVector | PolarVector
        
        var vector: Vector = { 
          "type": "cartesian"
        }
    `);

    const { error } = createSubtyper()(
      Types.Record.init({ type: Types.String }),
      Types.Alias.init(
        "Vector",
        Types.Union.init([
          Types.Interface.init("CartesianVector", { y: Types.Number }),
          Types.Interface.init("PolarVector", { angle: Types.Number }),
        ])
      ),
    );

    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(error)
    );
  });
});
