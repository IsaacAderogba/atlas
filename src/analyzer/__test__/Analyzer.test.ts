import { describe, it, expect } from "vitest";
import { SemanticErrors } from "../../errors/SemanticError";
import { Interpreter } from "../../runtime/Interpreter";
import { Parser } from "../../parser/Parser";
import { Scanner } from "../../parser/Scanner";
import { Analyzer } from "../Analyzer";
import { Reader } from "../../parser/Reader";

const setupTests = (source: string): { analyzer: Analyzer } => {
  const reader = new Reader();
  const scanner = new Scanner();
  const { tokens } = scanner.scan({ source, module: "test" });
  const parser = new Parser(tokens);
  const { statements } = parser.parse();
  const analyzer = new Analyzer(reader, new Interpreter(reader), statements);

  return { analyzer };
};

describe("Analyzer warnings", () => {
  it("warns with unused variable", () => {
    const expressions = ["var a = 'hello'"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.unusedVariable()
      );
    });
  });
});

describe("Analyzer errors", () => {
  it("errors with prohibited break", () => {
    const expressions = ["break"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedBreak()
      );
    });
  });

  it("errors with prohibited continue", () => {
    const expressions = ["continue"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedContinue()
      );
    });
  });

  it("errors with prohibited function return", () => {
    const expressions = ["return 4"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedFunctionReturn()
      );
    });
  });

  it("errors with prohibited init return", () => {
    const expressions = [
      `
      class Foo {
        init = f() {
          return null
        }
      }
    `,
    ];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedInitReturn()
      );
    });
  });

  it("errors with prohibited async init", () => {
    const expressions = [
      `
      class Foo {
        init = f*() {
        }
      }
    `,
    ];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedAsyncInit()
      );
    });
  });

  it("errors with prohibited async return", () => {
    const expressions = [
      `
      var foo = f*() {
        return null
      }
    `,
    ];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedAsyncReturn()
      );
    });
  });

  it("errors with prohibited this", () => {
    const expressions = ["this"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedThis()
      );
    });
  });

  it("errors with prohibited redeclaration", () => {
    const expressions = ["var x = 4 var print = 4"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedRedeclaration()
      );
    });
  });
});
