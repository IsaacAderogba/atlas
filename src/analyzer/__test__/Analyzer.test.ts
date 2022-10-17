import { describe, it, expect } from "vitest";
import { SemanticErrors } from "../../errors/SemanticError";

describe("Analyzer errors", () => {
  it("errors with prohibited break", () => {
    const expressions = ["break"];

    expressions.forEach(expr => {
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedBreak()
      );
    });
  });

  it("errors with prohibited continue", () => {
    const expressions = ["continue"];

    expressions.forEach(expr => {
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedContinue()
      );
    });
  });

  it("errors with prohibited function return", () => {
    const expressions = ["return 4"];

    expressions.forEach(expr => {
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
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
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedInitReturn()
      );
    });
  });

  it("errors with prohibited this", () => {
    const expressions = ["this"];

    expressions.forEach(expr => {
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedThis()
      );
    });
  });

  it("errors with prohibited redeclaration", () => {
    const expressions = ["var x = 4 var print = 4"];

    expressions.forEach(expr => {
      const { tester } = setupTester();
      const { errors } = tester.analyzeWorkflow(expr);
      expect(errors[0].sourceMessage).toMatchObject(
        SemanticErrors.prohibitedRedeclaration()
      );
    });
  });
});
