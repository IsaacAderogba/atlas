import { Analyzer } from "../../analyzer/Analyzer";
import { AssignExpr, VariableExpr } from "../../ast/Expr";
import { RuntimeErrors } from "../../errors/RuntimeError";
import { Parser } from "../../parser/Parser";
import { Scanner } from "../../parser/Scanner";
import { Interpreter } from "../Interpreter";

interface SetupTests {
  interpreter: Interpreter;
  interpret: () => ReturnType<Interpreter["interpret"]>;
  evaluate: () => ReturnType<Interpreter["evaluate"]>;
}

const setupTests = (source: string): SetupTests => {
  const scanner = new Scanner(source);
  const { tokens, errors: scanErrs } = scanner.scan();

  if (scanErrs.length) {
    console.log("Scan errors", scanErrs);
    throw new Error("Scan failed");
  }

  const parser = new Parser(tokens);
  const interpreter = new Interpreter();

  const setup: SetupTests = {
    interpreter,
    interpret: () => {
      const { statements, errors: parseErrs } = parser.parse();
      if (!statements || parseErrs.length) {
        console.log("Parse errors", parseErrs);
        throw new Error("Parse failed");
      }

      new Analyzer(interpreter, statements).analyze();
      return interpreter.interpret(statements);
    },
    evaluate: () => {
      return interpreter.evaluate(parser.expression());
    },
  };

  return setup;
};

describe("Interpreter statements", () => {
  it("interprets return statements", () => {
    const { interpreter, interpret } = setupTests(`
      var sayHi = f() { 
        return 3
      }
      var x = sayHi()
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 3 });
  });

  it("interprets block statements", () => {
    const { interpreter, interpret } = setupTests("var x = 4 { x = 2 }");
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 2 });
  });

  it("interprets class statements", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      
      var x = print(Foo)
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "Foo" });
  });

  it("interprets get and set expressions", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      var foo = Foo()
      foo.y = "hi"
      var x = foo.y
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "hi" });
  });

  it("interprets method calls", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {
        bar = f() {
          return "hi"
        }
      }
      var x = Foo().bar()
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "hi" });
  });

  it("interprets init calls", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {
        foo = "foo"
        init = f() {
          this.bar = this.foo # "bar"
        }
      }
      
      var x = Foo().bar
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "foobar" });
  });

  it("interprets static calls", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {
        static bar = f() {
          return "bar"
        }
      }
      
      var x = Foo.bar()
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "bar" });
  });

  it("interprets this expressions", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {
        bar = f() {
          return this.flavour
        }
      }
      var foo = Foo()
      foo.flavour = "chocolate"
      var x = foo.bar()
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "chocolate" });
  });

  it("interprets class instances", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      var foo = Foo()
      var x = print(foo)
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "Foo instance" });
  });

  it("interprets var statements", () => {
    const { interpreter, interpret } = setupTests("var x = 4");
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 4 });
  });

  it("interprets expression statements", () => {
    const { interpreter, interpret } = setupTests(
      'var x = true ? "hello" : "goodbye"'
    );
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "STRING", value: "hello" });
  });

  it("interprets while statements", () => {
    const tests = [
      "var x = 2 while (x < 5) x = x + 1",
      "var x = 2 while (x < 5; x = x + 1) {}",
    ];

    tests.forEach(test => {
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const { tokens } = new Scanner("x").scan();
      const expression = new Parser(tokens).expression() as VariableExpr;
      const result = interpreter.visitVariableExpr(expression);

      expect(result).toMatchObject({ type: "NUMBER", value: 5 });
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
      `
    var x = 0
    while (x < 5; x = x + 1) {
      break
    }
    `,
    ];

    tests.forEach(test => {
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const { tokens } = new Scanner("x").scan();
      const expression = new Parser(tokens).expression() as VariableExpr;
      const result = interpreter.visitVariableExpr(expression);

      expect(result).toMatchObject({ type: "NUMBER", value: 0 });
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
      `
    var x = 0
    var y = 0
    while (x < 5; x = x + 1) {
      if (x == 2) continue      
      y = y + 1
    }
    `,
    ];

    tests.forEach(test => {
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const expressions = [
        { char: "y", object: { type: "NUMBER", value: 4 } },
        { char: "x", object: { type: "NUMBER", value: 5 } },
      ];

      expressions.forEach(({ char, object }) => {
        const { tokens } = new Scanner(char).scan();
        const expression = new Parser(tokens).expression() as VariableExpr;
        const result = interpreter.visitVariableExpr(expression);
        expect(result).toMatchObject(object);
      });
    });
  });

  it("interprets if statements", () => {
    const { interpreter, interpret } = setupTests(
      "var x = 2 if (x == 2) x = 1"
    );
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 1 });
  });
});

describe("Interpreter evaluations", () => {
  it("executes call expressions", () => {
    const { interpreter, interpret } = setupTests(`
      var x = 1
      var sayHi = f() { 
        x = 2
      }
      sayHi()
    `);
    interpret();

    const { tokens } = new Scanner("x").scan();
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 2 });
  });

  it("evaluates assignment expressions", () => {
    const { interpreter, interpret } = setupTests("var x = 4");
    interpret();

    const { tokens } = new Scanner("x = 2").scan();
    const expression = new Parser(tokens).expression() as AssignExpr;
    const result = interpreter.visitAssignExpr(expression);

    expect(result).toMatchObject({ type: "NUMBER", value: 2 });
  });

  it("evaluates ternary expression", () => {
    const tests = [
      { source: "true ? true : false", object: { value: true } },
      { source: "false ? true : false", object: { value: false } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates logical expressions", () => {
    const tests = [
      { source: "false or true", object: { value: true } },
      { source: "false and true", object: { value: false } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
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
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates unary expressions", () => {
    const tests = [
      { source: "!true", object: { value: false } },
      { source: "-4", object: { value: -4 } },
      { source: "--4", object: { value: 4 } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
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
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });

  it("evaluates grouping expressions", () => {
    const tests = [
      { source: "4 + 4 * 4", object: { value: 20 } },
      { source: "(4 + 4) * 4", object: { value: 32 } },
    ];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toMatchObject(object);
    });
  });
});

describe("Interpreter errors", () => {
  it("errors with expected string", () => {
    const sources = ["4 # '4'"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedString());
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedNumber());
    });
  });

  it("errors with expected boolean", () => {
    const sources = ["!'4'", "4 ? true : false"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedBoolean());
    });
  });

  it("errors with prohibited zero division", () => {
    const sources = ["4 / 0"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(
        RuntimeErrors.mismatchedArity(2, 3)
      );
    });
  });

  it("errors with expected callable", () => {
    const sources = [`"hi"()`];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(RuntimeErrors.expectedCallable());
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].message).toMatchObject(
        RuntimeErrors.undefinedProperty("y")
      );
    });
  });
});
