import { Types } from "../../primitives/AtlasType";
import { TypeCheckErrors } from "../../errors/TypeCheckError";
import { describe, expect, it } from "vitest";

describe("Typechecker inference", () => {
  it("infers any", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Any)).toEqual(true);
  });

  it("infers numbers", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Number)).toEqual(true);
    expect(tester.evalTypeWorkflow("'4'").isSubtype(Types.Number)).toEqual(
      false
    );
  });

  it("infers strings", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("'foo'").isSubtype(Types.String)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.String)).toEqual(false);
  });

  it("infers booleans", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("true").isSubtype(Types.Boolean)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("false").isSubtype(Types.Boolean)).toEqual(
      true
    );
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Boolean)).toEqual(
      false
    );
  });

  it("infers null", () => {
    const { tester } = setupTester();

    expect(tester.evalTypeWorkflow("null").isSubtype(Types.Null)).toEqual(true);
    expect(tester.evalTypeWorkflow("4").isSubtype(Types.Null)).toEqual(false);
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
      Types.Record.init({
        foo: Types.String,
        "1": Types.Number,
      }).isSubtype(tester.evalTypeWorkflow("x"))
    ).toEqual(true);
  });

  it("infers get expression", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow(`
      var x = { "foo": { "foo": "bar" } }
    `);

    expect(
      Types.String.isSubtype(tester.evalTypeWorkflow("x.foo.foo"))
    ).toEqual(true);
  });

  it("infers unary expressions", () => {
    const types = [
      { source: "!!true", subtype: Types.Boolean },
      { source: "-5", subtype: Types.Number },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();

      expect(tester.evalTypeWorkflow(source).isSubtype(subtype)).toEqual(true);
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

      expect(tester.evalTypeWorkflow(source).isSubtype(subtype)).toEqual(true);
    });
  });

  it("infers logical expressions", () => {
    const types = [
      { source: "true or false", subtype: Types.Boolean },
      { source: "false and false", subtype: Types.Boolean },
    ];

    types.forEach(({ source, subtype }) => {
      const { tester } = setupTester();

      expect(tester.evalTypeWorkflow(source).isSubtype(subtype)).toEqual(true);
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
      expect(type.isSubtype(tester.evalTypeWorkflow("x"))).toEqual(true);
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
      Types.Function.init({ params: [Types.Number], returns: Types.Number })
    );
  });
});

describe("Typechecker annotations", () => {
  it("annotates function expressions", () => {
    const { tester } = setupTester();

    tester.typeCheckWorkflow("var x: (Number) -> Number = f(x) { return 1 }");
    expect(
      Types.Function.init({ params: [Types.Number], returns: Types.Number })
    );
  });
});

describe("Typechecker errors", () => {
  it("errors with invalid subtypes for unary expressions", () => {
    const types = [
      {
        source: "!4",
        error: TypeCheckErrors.invalidSubtype(
          Types.Boolean.type,
          Types.Number.type
        ),
      },
      {
        source: "-true",
        error: TypeCheckErrors.invalidSubtype(
          Types.Number.type,
          Types.Boolean.type
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
          Types.String.type,
          Types.Number.type
        ),
      },
      {
        source: "4 + null",
        error: TypeCheckErrors.invalidSubtype(
          Types.Number.type,
          Types.Null.type
        ),
      },
      {
        source: "4 >= true",
        error: TypeCheckErrors.invalidSubtype(
          Types.Number.type,
          Types.Boolean.type
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
          Types.Boolean.type,
          Types.String.type
        ),
      },
      {
        source: "false and null",
        error: TypeCheckErrors.invalidSubtype(
          Types.Boolean.type,
          Types.Null.type
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
      TypeCheckErrors.invalidSubtype(Types.Number.type, Types.Boolean.type)
    );
  });

  it("errors with invalid subtype for if statements", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("if (4 + 4) {}");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(Types.Boolean.type, Types.Number.type)
    );
  });

  it("errors with invalid subtype for while statements", () => {
    const { tester } = setupTester();

    const { errors } = tester.typeCheckWorkflow("while (4 + 4) {}");
    expect(errors[0].sourceMessage).toEqual(
      TypeCheckErrors.invalidSubtype(Types.Boolean.type, Types.Number.type)
    );
  });

  it("errors with invalid subtype for function annotations", () => {
    const types = [
      {
        // function specifies an argument while declaration doesn't
        source: "var x: () -> Null = f(y) { }",
        error: TypeCheckErrors.invalidSubtype(
          Types.Function.init({
            params: [],
            returns: Types.Null,
          }).toString(),
          Types.Function.init({
            params: [Types.Any],
            returns: Types.Null,
          }).toString()
        ),
      },
      {
        // declaration specifies an argument while function doesn't
        source: "var x: (Number) -> Null = f() { }",
        error: TypeCheckErrors.invalidSubtype(
          Types.Function.init({
            params: [Types.Number],
            returns: Types.Null,
          }).toString(),
          Types.Function.init({
            params: [],
            returns: Types.Null,
          }).toString()
        ),
      },
      {
        // function returns incorrect output
        source: "var x: () -> String = f() { }",
        error: TypeCheckErrors.invalidSubtype(
          Types.Function.init({ params: [], returns: Types.String }).toString(),
          Types.Function.init({ params: [], returns: Types.Null }).toString()
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
          Types.Number.toString(),
          Types.String.toString()
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
        Types.Function.init({
          params: [Types.Number],
          returns: Types.Number,
        }).toString(),
        Types.Function.init({ params: [], returns: Types.Number }).toString()
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
});
