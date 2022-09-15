/* eslint-disable no-var */
import { Stmt } from "../src/ast/Stmt";
import { Parser } from "../src/parser/Parser";
import { Scanner } from "../src/parser/Scanner";
import { AtlasValue } from "../src/primitives/AtlasValue";
import { Interpreter } from "../src/runtime/Interpreter";
import { Analyzer } from "../src/analyzer/Analyzer";
import { TypeChecker } from "../src/typechecker/TypeChecker";
import { Token } from "../src/ast/Token";
import { Expr } from "../src/ast/Expr";
import { AtlasType } from "../src/primitives/AtlasType";
import { SourceError } from "../src/errors/SourceError";
import { ConsoleReporter } from "../src/reporter/ConsoleReporter";

class Tester {
  private reporter = new ConsoleReporter();
  public interpreter = new Interpreter();
  public typechecker = new TypeChecker();

  interpretWorkflow(source: string): void {
    const { tokens } = this.scan(source);
    const { statements } = this.parse(tokens);
    this.analyze(statements);
    // this.typechecker.typeCheck(statements);
    this.interpreter.interpret(statements);
  }

  evaluateWorkflow(source: string): AtlasValue {
    const expression = this.testExpress(source);
    return this.interpreter.evaluate(expression);
  }

  typeCheckWorkflow(source: string): ReturnType<TypeChecker["typeCheck"]> {
    const { statements } = this.parseWorkflow(source);
    const { errors } = this.analyze(statements);
    if (this.reportErrors(source, errors)) throw new Error("Analysis error");
    return this.typechecker.typeCheck(statements);
  }

  evalTypeWorkflow(source: string): AtlasType {
    const expression = this.testExpress(source);
    return this.typechecker.checkExpr(expression);
  }

  evalTypeExprWorkflow(source: string): AtlasType {
    const expression = this.testExpress(source);
    return this.typechecker.checkExpr(expression);
  }

  parseWorkflow(source: string): ReturnType<Parser["parse"]> {
    const { tokens } = this.scan(source);
    return this.parse(tokens);
  }

  testExpress(source: string): Expr {
    const { tokens } = this.scan(source);
    return this.parseExpression(tokens);
  }

  private scan(source: string): ReturnType<Scanner["scan"]> {
    const scanner = new Scanner(source);
    return scanner.scan();
  }

  private parse(tokens: Token[]): ReturnType<Parser["parse"]> {
    const parser = new Parser(tokens);
    return parser.parse();
  }

  private parseExpression(tokens: Token[]): ReturnType<Parser["expression"]> {
    const parser = new Parser(tokens);
    return parser.expression();
  }

  private analyze(statements: Stmt[]): ReturnType<Analyzer["analyze"]> {
    const analyzer = new Analyzer(this.interpreter, statements);
    return analyzer.analyze();
  }

  private reportErrors(source: string, errors: SourceError[]): boolean {
    let hasError = false;

    errors.forEach(({ sourceMessage, sourceRange }) => {
      if (sourceMessage.type === "error") {
        hasError = true;
        this.reporter.rangeError(source, sourceRange, sourceMessage);
      }
    });

    return hasError;
  }
}

const setupTester = (): { tester: Tester } => {
  const tester = new Tester();
  return { tester };
};

global.setupTester = setupTester;

declare global {
  var setupTester: () => { tester: Tester };
}
