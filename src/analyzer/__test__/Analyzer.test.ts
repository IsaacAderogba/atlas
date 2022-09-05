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
      expect(errors[0].message).toMatchObject(SemanticErrors.prohibitedContinue());
    });
  });

  it("errors with prohibited return", () => {
    const expressions = ["return 4;"];

    expressions.forEach(expr => {
      const { analyzer } = setupTests(expr);

      const { errors } = analyzer.analyze();
      expect(errors[0].message).toMatchObject(SemanticErrors.prohibitedReturn());
    });
  });
});
