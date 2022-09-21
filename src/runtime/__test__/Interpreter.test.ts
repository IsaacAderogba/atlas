import { describe, it, expect } from "vitest";
import { Analyzer } from "../../analyzer/Analyzer";
import { AssignExpr, VariableExpr } from "../../ast/Expr";
import { RuntimeErrors } from "../../errors/RuntimeError";
import { Parser } from "../../parser/Parser";
import { Reader } from "../../parser/Reader";
import { Scanner } from "../../parser/Scanner";
import { AtlasList } from "../../primitives/AtlasList";
import { Interpreter } from "../Interpreter";

interface SetupTests {
  interpreter: Interpreter;
  interpret: () => ReturnType<Interpreter["interpret"]>;
  evaluate: () => ReturnType<Interpreter["evaluate"]>;
}

const setupTests = (source: string): SetupTests => {
  const reader = new Reader();
  const scanner = new Scanner();
  const { tokens, errors: scanErrs } = scanner.scan({ source, module: "test" });

  if (scanErrs.length) {
    console.error("Scan errors", scanErrs);
    throw new Error("Scan failed");
  }

  const parser = new Parser(tokens);
  const interpreter = new Interpreter(reader);

  const setup: SetupTests = {
    interpreter,
    interpret: () => {
      const { statements, errors: parseErrs } = parser.parse();
      if (!statements || parseErrs.length) {
        console.error("Parse errors", parseErrs);
        throw new Error("Parse failed");
      }

      new Analyzer(reader, interpreter, statements).analyze();
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 3 });
  });

  it("interprets block statements", () => {
    const { interpreter, interpret } = setupTests("var x = 4 { x = 2 }");
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 2 });
  });

  it("interprets class statements", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      
      var x = print(Foo)
    `);
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "Foo" });
  });

  it("interprets get and set expressions", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      var foo = Foo()
      foo.y = "hi"
      var x = foo.y
    `);
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "hi" });
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "hi" });
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "foobar" });
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "chocolate" });
  });

  it("interprets class instances", () => {
    const { interpreter, interpret } = setupTests(`
      class Foo {}
      var foo = Foo()
      var x = print(foo)
    `);
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "Foo instance" });
  });

  it("interprets var statements", () => {
    const { interpreter, interpret } = setupTests("var x = 4");
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 4 });
  });

  it("interprets expression statements", () => {
    const { interpreter, interpret } = setupTests(
      'var x = true ? "hello" : "goodbye"'
    );
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "String", value: "hello" });
  });

  it("interprets while statements", () => {
    const tests = [
      "var x = 2 while (x < 5) x = x + 1",
      "var x = 2 while (x < 5) { x = x + 1 }",
    ];

    tests.forEach(test => {
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const { tokens } = new Scanner().scan({ module: "test", source: "x" });
      const expression = new Parser(tokens).expression() as VariableExpr;
      const result = interpreter.visitVariableExpr(expression);

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
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const { tokens } = new Scanner().scan({ module: "test", source: "x" });
      const expression = new Parser(tokens).expression() as VariableExpr;
      const result = interpreter.visitVariableExpr(expression);

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
      const { interpreter, interpret } = setupTests(test);
      interpret();

      const expressions = [
        { char: "y", object: { type: "Number", value: 4 } },
        { char: "x", object: { type: "Number", value: 5 } },
      ];

      expressions.forEach(({ char, object }) => {
        const { tokens } = new Scanner().scan({ module: "test", source: char });
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 1 });
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

    const { tokens } = new Scanner().scan({ module: "test", source: "x" });
    const expression = new Parser(tokens).expression() as VariableExpr;
    const result = interpreter.visitVariableExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 2 });
  });

  it("evaluates assignment expressions", () => {
    const { interpreter, interpret } = setupTests("var x = 4");
    interpret();

    const { tokens } = new Scanner().scan({ module: "test", source: "x = 2" });
    const expression = new Parser(tokens).expression() as AssignExpr;
    const result = interpreter.visitAssignExpr(expression);

    expect(result).toMatchObject({ type: "Number", value: 2 });
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
      { source: "false || true", object: { value: true } },
      { source: "false && true", object: { value: false } },
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

  it("evaluates list expressions", () => {
    const tests = [{ source: "[1, 2, 3]", object: AtlasList }];

    tests.forEach(({ object, source }) => {
      const { evaluate } = setupTests(source);
      expect(evaluate()).toBeInstanceOf(object);
    });
  });
});

describe("Interpreter errors", () => {
  it("errors with expected string", () => {
    const sources = ["4 # '4'"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedNumber()
      );
    });
  });

  it("errors with expected boolean", () => {
    const sources = ["!'4'", "4 ? true : false"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.expectedBoolean()
      );
    });
  });

  it("errors with prohibited zero division", () => {
    const sources = ["4 / 0"];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.mismatchedArity(2, 3)
      );
    });
  });

  it("errors with expected callable", () => {
    const sources = [`"hi"()`];

    sources.forEach(source => {
      const { interpret } = setupTests(source);

      const { errors } = interpret();
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
      const { interpret } = setupTests(source);

      const { errors } = interpret();
      expect(errors[0].sourceMessage).toMatchObject(
        RuntimeErrors.undefinedProperty("y")
      );
    });
  });
});
