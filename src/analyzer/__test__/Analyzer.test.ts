import { SemanticErrors } from "../../errors/SemanticError";
import { Interpreter } from "../../interpreter/Interpreter";
import { Parser } from "../../parser/Parser";
import { Scanner } from "../../parser/Scanner";
import { Analyzer } from "../Analyzer";

const setupTests = (source: string): { analyzer: Analyzer } => {
  const scanner = new Scanner(source);
  const { tokens } = scanner.scan();
  const parser = new Parser(tokens);
  const { statements } = parser.parse();
  const analyzer = new Analyzer(new Interpreter(), statements);

  return { analyzer };
};

describe("Analyzer warnings", () => {
  it("warns with unused variable", () => {
    const expressions = ["var a = 'hello';"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(SemanticErrors.unusedVariable());
    });
  });
});

describe("Analyzer errors", () => {
  it("errors with prohibited break", () => {
    const expressions = ["break;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(SemanticErrors.prohibitedBreak());
    });
  });

  it("errors with prohibited continue", () => {
    const expressions = ["continue;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(
        SemanticErrors.prohibitedContinue()
      );
    });
  });

  it("errors with prohibited function return", () => {
    const expressions = ["return 4;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(
        SemanticErrors.prohibitedFunctionReturn()
      );
    });
  });

  it("errors with prohibited init return", () => {
    const expressions = [
      `
      class Foo {
        init = f() {
          return null;
        }
      }
    `,
    ];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(
        SemanticErrors.prohibitedInitReturn()
      );
    });
  });

  it("errors with prohibited this", () => {
    const expressions = ["this;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(SemanticErrors.prohibitedThis());
    });
  });

  it("errors with prohibited redeclaration", () => {
    const expressions = ["var x = 4; var print = 4;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(
        SemanticErrors.prohibitedRedeclaration()
      );
    });
  });
});
