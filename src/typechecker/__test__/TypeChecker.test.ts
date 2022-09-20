import { Types } from "../../primitives/AtlasType";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { describe, expect, it } from "vitest";
import { createSubtyper } from "../isSubtype";

describe("Typechecker inference", () => {
  it("infers any", () => {
    const { tester } = setupTester();

    expect(
      createSubtyper()(tester.evalTypeWorkflow("4"), Types.Any).isSubtype
    ).toEqual(true);
  });

  it("infers numbers", () => {
    const { tester } = setupTester();

    expect(
      createSubtyper()(tester.evalTypeWorkflow("4"), Types.Number).isSubtype
    ).toEqual(true);

    expect(
      createSubtyper()(tester.evalTypeWorkflow("'4'"), Types.Number).isSubtype
    ).toEqual(false);
  });

  it("infers strings", () => {
    const { tester } = setupTester();

    expect(
      createSubtyper()(tester.evalTypeWorkflow("'foo'"), Types.String).isSubtype
    ).toEqual(true);
    expect(
      createSubtyper()(tester.evalTypeWorkflow("4"), Types.String).isSubtype
    ).toEqual(false);
  });

  it("infers booleans", () => {
    const { tester } = setupTester();

    expect(
      createSubtyper()(tester.evalTypeWorkflow("true"), Types.Boolean).isSubtype
    ).toEqual(true);
    expect(
      createSubtyper()(tester.evalTypeWorkflow("false"), Types.Boolean)
        .isSubtype
    ).toEqual(true);
    expect(
      createSubtyper()(tester.evalTypeWorkflow("4"), Types.Boolean).isSubtype
    ).toEqual(false);
  });

  it("infers null", () => {
    const { tester } = setupTester();

    expect(
      createSubtyper()(tester.evalTypeWorkflow("null"), Types.Null).isSubtype
    ).toEqual(true);
    expect(
      createSubtyper()(tester.evalTypeWorkflow("4"), Types.Null).isSubtype
    ).toEqual(false);
  });

  it("infers record", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow(`
      var x = {
        "foo": "bar",
        "1": 2
      }
    `);

    expect(
      createSubtyper()(
        Types.Record.init({
          foo: Types.String,
          "1": Types.Number,
        }),
        tester.evalTypeWorkflow("x")
      ).isSubtype
    ).toEqual(true);
  });

  it("infers get expression", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow(`
      var x = { "foo": { "foo": "bar" } }
    `);

    expect(
      createSubtyper()(Types.String, tester.evalTypeWorkflow("x.foo.foo"))
        .isSubtype
    ).toEqual(true);
  });

  it("infers unary expressions", () => {
    const types = [
      { source: "!!true", subtype: Types.Boolean },
      { source: "-5", subtype: Types.Number },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();

      expect(
        createSubtyper()(tester.evalTypeWorkflow(source), subtype).isSubtype
      ).toEqual(true);
    });
  });

  it("infers unary expressions", () => {
    const types = [
      { source: "'4' # '4'", subtype: Types.String },
      { source: "4 + 4", subtype: Types.Number },
      { source: "4 - 4", subtype: Types.Number },
      { source: "4 / 4", subtype: Types.Number },
      { source: "4 * 4", subtype: Types.Number },
      { source: "4 > 4", subtype: Types.Boolean },
      { source: "4 >= 4", subtype: Types.Boolean },
      { source: "4 < 4", subtype: Types.Boolean },
      { source: "4 <= 4", subtype: Types.Boolean },
      { source: "4 == 4", subtype: Types.Boolean },
      { source: "4 != 4", subtype: Types.Boolean },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();
      expect(
        createSubtyper()(tester.evalTypeWorkflow(source), subtype).isSubtype
      ).toEqual(true);
    });
  });

  it("infers logical expressions", () => {
    const types = [
      { source: "true or false", subtype: Types.Boolean },
      { source: "false and false", subtype: Types.Boolean },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();

      expect(
        createSubtyper()(tester.evalTypeWorkflow(source), subtype).isSubtype
      ).toEqual(true);
    });
  });

  it("infers variable declarations", () => {
    const types = [
      { source: "var x = true", type: Types.Boolean },
      { source: "var x = false", type: Types.Boolean },
      { source: "var x = 'foo'", type: Types.String },
      { source: "var x = 4", type: Types.Number },
      { source: "var x = null", type: Types.Null },
    ];

    types.forEach(({ source, type }) => {
      const { tester } = setupTester();

      tester.typeCheckWorkflow(source);
      expect(
        createSubtyper()(type, tester.evalTypeWorkflow("x")).isSubtype
      ).toEqual(true);
    });
  });

  it("infers function expressions", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow(`
      var x: (Number) -> Number = f(x) { 
        return 1
      }
      
      x = f(x) { 
        return 2 
      }
    `);

    expect(
      createSubtyper()(
        Types.Function.init({
          params: [Types.Number],
          returns: Types.Number,
        }),
        tester.evalTypeWorkflow("x")
      ).isSubtype
    ).toEqual(true);
  });

  it("annotates function expressions", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow("var x: (Number) -> Number = f(x) { return 1 }");
    expect(
      createSubtyper()(
        Types.Function.init({
          params: [Types.Number],
          returns: Types.Number,
        }),
        tester.evalTypeWorkflow("x")
      ).isSubtype
    ).toEqual(true);
  });
});

describe("Typechecker statements", () => {
  it("aliases types", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow("type Foo = String");
    expect(
      createSubtyper()(Types.String, tester.evalTypeExprWorkflow("Foo"))
        .isSubtype
    ).toEqual(true);
  });
});

describe("Typechecker errors", () => {
  it("errors with invalid subtypes for unary expressions", () => {
    const types = [
      {
        source: "!4",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Number, Types.Boolean).error
        ),
      },
      {
        source: "-true",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Boolean, Types.Number).error
        ),
      },
    ];

    types.forEach(({ source, error }) => {
      const { tester } = setupTester();

      const { errors } = tester.typeCheckWorkflow(source);
      expect(errors[0].sourceMessage).toEqual(error);
    });
  });

  it("errors with invalid subtypes for binary expressions", () => {
    const types = [
      {
        source: "4 # '4'",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Number, Types.String).error
        ),
      },
      {
        source: "4 + null",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Null, Types.Number).error
        ),
      },
      {
        source: "4 >= true",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Boolean, Types.Number).error
        ),
      },
    ];

    types.forEach(({ source, error }) => {
      const { tester } = setupTester();

      const { errors } = tester.typeCheckWorkflow(source);
      expect(errors[0].sourceMessage).toEqual(error);
    });
  });

  it("errors with invalid subtypes for logical expressions", () => {
    const types = [
      {
        source: "true or '4'",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.String, Types.Boolean).error
        ),
      },
      {
        source: "false and null",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.Null, Types.Boolean).error
        ),
      },
    ];

    types.forEach(({ source, error }) => {
      const { tester } = setupTester();

      const { errors } = tester.typeCheckWorkflow(source);
      expect(errors[0].sourceMessage).toEqual(error);
    });
  });

  it("errors with invalid subtype for variable declarations", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("var x: Number = true");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        createSubtyper()(Types.Boolean, Types.Number).error
      )
    );
  });

  it("errors with invalid subtype for if statements", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("if (4 + 4) {}");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        createSubtyper()(Types.Number, Types.Boolean).error
      )
    );
  });

  it("errors with invalid subtype for while statements", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("while (4 + 4) {}");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        createSubtyper()(Types.Number, Types.Boolean).error
      )
    );
  });

  it("errors with invalid subtype for function annotations", () => {
    const types = [
      {
        // function specifies an argument while declaration doesn't
        source: "var x: () -> Null = f(y) { }",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(
            Types.Function.init({
              params: [Types.Any],
              returns: Types.Null,
            }),
            Types.Function.init({
              params: [],
              returns: Types.Null,
            }),
          ).error
        ),
      },
      {
        // declaration specifies an argument while function doesn't
        source: "var x: (Number) -> Null = f() { }",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(
            Types.Function.init({
              params: [],
              returns: Types.Null,
            }),
            Types.Function.init({
              params: [Types.Number],
              returns: Types.Null,
            })
          ).error
        ),
      },
      {
        // function returns incorrect output
        source: "var x: () -> String = f() { }",
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(
            Types.Function.init({ params: [], returns: Types.Null }),
            Types.Function.init({ params: [], returns: Types.String })
          ).error
        ),
      },
    ];

    types.forEach(({ source, error }) => {
      const { tester } = setupTester();

      const { errors } = tester.typeCheckWorkflow(source);
      expect(errors[0].sourceMessage).toEqual(error);
    });
  });

  it("errors for invalid call expressions", () => {
    const types = [
      {
        error: TypeCheckErrors.mismatchedArity(1, 0),
        source: `
          var x: (Number) -> Null = f(x) { }
          x()
        `,
      },
      {
        error: TypeCheckErrors.expectedCallableType(),
        source: `""()`,
      },
      {
        error: TypeCheckErrors.invalidSubtype(
          createSubtyper()(Types.String, Types.Number).error
        ),
        source: `
          var x: (Number) -> Null = f(x) { }
          x("")
        `,
      },
    ];

    types.forEach(({ source, error }) => {
      const { tester } = setupTester();

      const { errors } = tester.typeCheckWorkflow(source);
      expect(errors[0].sourceMessage).toEqual(error);
    });
  });

  it("errors with invalid subtype for function inference", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow(`
    var x: (Number) -> Number = f(x) { 
      return 1
    }
    
    x = f() { 
      return 2 
    }
  `);
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(
        createSubtyper()(
          Types.Function.init({ params: [], returns: Types.Number }),
          Types.Function.init({
            params: [Types.Number],
            returns: Types.Number,
          })
        ).error
      )
    );
  });

  it("errors with required function annotation", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("f() {}");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.requiredFunctionAnnotation()
    );
  });

  it("errors with prohibited type redeclaration", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("type String = Number");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.prohibitedTypeRedeclaration()
    );
  });

  it("warns with unused type", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("type Foo = Number");
    expect(errors[0].sourceMessage).toEqual(TypeCheckErrors.unusedType());
  });
});
