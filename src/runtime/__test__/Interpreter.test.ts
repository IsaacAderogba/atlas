import { describe, it, expect } from "vitest";
import { RuntimeErrors } from "../../errors/RuntimeError";
import { AtlasList } from "../../primitives/AtlasList";

describe("Interpreter statements", () => {
  it("interprets return statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      var sayHi = f() { 
        return 3
      }
      var x = sayHi()
    `);

    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "Number", value: 3 });
  });

  it("interprets block statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow("var x = 4 { x = 2 }");
    const result = tester.evaluateWorkflow("x");

    expect(result).toMatchObject({ type: "Number", value: 2 });
  });

  it("interprets class statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {}
      
      var x = print(Foo)
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "Foo" });
  });

  it("interprets get and set expressions", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {}
      var foo = Foo()
      foo.y = "hi"
      var x = foo.y
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "hi" });
  });

  it("interprets method calls", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {
        bar = f() {
          return "hi"
        }
      }
      var x = Foo().bar()
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "hi" });
  });

  it("interprets init calls", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {
        foo = "foo"
        init = f() {
          this.bar = this.foo # "bar"
        }
      }
      
      var x = Foo().bar
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "foobar" });
  });

  it("interprets this expressions", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {
        bar = f() {
          return this.flavour
        }
      }
      var foo = Foo()
      foo.flavour = "chocolate"
      var x = foo.bar()
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "chocolate" });
  });

  it("interprets class instances", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      class Foo {}
      var foo = Foo()
      var x = print(foo)
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "Foo instance" });
  });

  it("interprets var statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow("var x = 4");
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "Number", value: 4 });
  });

  it("interprets expression statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow('var x = true ? "hello" : "goodbye"');
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "String", value: "hello" });
  });

  it("interprets while statements", () => {
    const tests = [
      "var x = 2 while (x < 5) x = x + 1",
      "var x = 2 while (x < 5) { x = x + 1 }",
    ];

    tests.forEach(test => {
      const { tester } = setupTester();
      tester.interpretWorkflow(test);
      const result = tester.evaluateWorkflow("x");
      expect(result).toMatchObject({ type: "Number", value: 5 });
    });
  });

  it("interprets while break statements", () => {
    const tests = [
      `
    var x = 0
    while (x < 5) {
      break
      x = x + 1
    }
    `,
    ];

    tests.forEach(test => {
      const { tester } = setupTester();
      tester.interpretWorkflow(test);
      const result = tester.evaluateWorkflow("x");
      expect(result).toMatchObject({ type: "Number", value: 0 });
    });
  });

  it("interprets while continue statements", () => {
    const tests = [
      `
    var x = 0
    var y = 0
    while (x < 5) {
      x = x + 1
      if (x == 2) continue  
      y = y + 1
    }
    `,
    ];

    tests.forEach(test => {
      const { tester } = setupTester();
      tester.interpretWorkflow(test);

      const expressions = [
        { char: "y", object: { type: "Number", value: 4 } },
        { char: "x", object: { type: "Number", value: 5 } },
      ];

      expressions.forEach(({ char, object }) => {
        const result = tester.evaluateWorkflow(char);
        expect(result).toMatchObject(object);
      });
    });
  });

  it("interprets if statements", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow("var x = 2 if (x == 2) x = 1");
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "Number", value: 1 });
  });
});

describe("Interpreter evaluations", () => {
  it("executes call expressions", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow(`
      var x = 1
      var sayHi = f() { 
        x = 2
      }
      sayHi()
    `);
    const result = tester.evaluateWorkflow("x");
    expect(result).toMatchObject({ type: "Number", value: 2 });
  });

  it("evaluates assignment expressions", () => {
    const { tester } = setupTester();
    tester.interpretWorkflow("var x = 4");
    const result = tester.evaluateWorkflow("x = 2");
    expect(result).toMatchObject({ type: "Number", value: 2 });
  });

  it("evaluates ternary expression", () => {
    const tests = [
      { source: "true ? true : false", object: { value: true } },
      { source: "false ? true : false", object: { value: false } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates logical expressions", () => {
    const tests = [
      { source: "false || true", object: { value: true } },
      { source: "false && true", object: { value: false } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates binary expressions", () => {
    const tests = [
      { source: "4 + 4", object: { value: 8 } },
      { source: "4 - 4", object: { value: 0 } },
      { source: "4 / 4", object: { value: 1 } },
      { source: "4 * 4", object: { value: 16 } },
      { source: "4 > 4", object: { value: false } },
      { source: "4 >= 4", object: { value: true } },
      { source: "4 < 4", object: { value: false } },
      { source: "4 <= 4", object: { value: true } },
      { source: "4 != 4", object: { value: false } },
      { source: "4 == 4", object: { value: true } },
      { source: "'4' # '4'", object: { value: "44" } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates unary expressions", () => {
    const tests = [
      { source: "!true", object: { value: false } },
      { source: "-4", object: { value: -4 } },
      { source: "--4", object: { value: 4 } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates literal expressions", () => {
    const tests = [
      { source: "true", object: { value: true } },
      { source: "false", object: { value: false } },
      { source: "4", object: { value: 4 } },
      { source: "null", object: { value: null } },
      { source: "'string'", object: { value: "string" } },
      { source: '"string"', object: { value: "string" } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates grouping expressions", () => {
    const tests = [
      { source: "4 + 4 * 4", object: { value: 20 } },
      { source: "(4 + 4) * 4", object: { value: 32 } },
    ];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toMatchObject(object);
    });
  });

  it("evaluates list expressions", () => {
    const tests = [{ source: "[1, 2, 3]", object: AtlasList }];

    tests.forEach(({ object, source }) => {
      const { tester } = setupTester();
      expect(tester.evaluateWorkflow(source)).toBeInstanceOf(object);
    });
  });
});

describe("Interpreter errors", () => {
  it("errors with expected string", () => {
    const sources = ["4 # '4'"];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedString()
      );
    });
  });

  it("errors with expected number", () => {
    const sources = [
      "-'4'",
      "4 + '4'",
      "4 - '4'",
      "4 / '4'",
      "4 * '4'",
      "4 > '4'",
      "4 >= '4'",
      "4 < '4'",
      "4 <= '4'",
    ];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedNumber()
      );
    });
  });

  it("errors with expected boolean", () => {
    const sources = ["!'4'", "4 ? true : false"];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedBoolean()
      );
    });
  });

  it("errors with prohibited zero division", () => {
    const sources = ["4 / 0"];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.prohibitedZeroDivision()
      );
    });
  });

  it("errors with mismatched arity", () => {
    const sources = [
      `
      var x = 1
      var sayHi = f(a, b) { 
        x = 2
      }
      sayHi("a", "b", "c")
    `,
    ];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.mismatchedArity(2, 3)
      );
    });
  });

  it("errors with expected callable", () => {
    const sources = [`"hi"()`];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedCallable()
      );
    });
  });

  it("errors with undefined property", () => {
    const sources = [
      `
      class Foo {}
      var foo = Foo()
      foo.y
    `,
    ];

    sources.forEach(source => {
      const { tester } = setupTester();
      const { errors } = tester.interpretWorkflow(source);
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.undefinedProperty("y")
      );
    });
  });
});
