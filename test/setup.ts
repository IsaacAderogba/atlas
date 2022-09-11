/* eslint-disable no-var */
import { Stmt } from "../src/ast/Stmt";
import { Parser } from "../src/parser/Parser";
import { Scanner } from "../src/parser/Scanner";
import { AtlasValue } from "../src/primitives/AtlasValue";
import { Interpreter } from "../src/runtime/Interpreter";
import { Analyzer } from "../src/analyzer/Analyzer";
import { TypeChecker } from "../src/typechecker/TypeChecker";
import { Token } from "../src/ast/Token";

class Tester {
  public interpreter = new Interpreter();

  interpret(source: string): void {
    const { tokens } = this.scan(source);
    const { statements } = this.parse(tokens);
    this.analyze(statements);
    this.typecheck(statements);
    this.interpreter.interpret(statements);
  }

  evaluate(source: string): AtlasValue {
    const { tokens } = this.scan(source);
    const expression = this.parseExpression(tokens);
    return this.interpreter.evaluate(expression);
  }

  scan(source: string): ReturnType<Scanner["scan"]> {
    const scanner = new Scanner(source);
    return scanner.scan();
  }

  parse(tokens: Token[]): ReturnType<Parser["parse"]> {
    const parser = new Parser(tokens);
    return parser.parse();
  }

  parseExpression(tokens: Token[]): ReturnType<Parser["expression"]> {
    const parser = new Parser(tokens);
    return parser.expression();
  }

  analyze(statements: Stmt[]): ReturnType<Analyzer["analyze"]> {
    const analyzer = new Analyzer(this.interpreter, statements);
    return analyzer.analyze();
  }

  typecheck(statements: Stmt[]): ReturnType<TypeChecker["typeCheck"]> {
    const typechecker = new TypeChecker(this.interpreter, statements);
    return typechecker.typeCheck();
  }
}

const setupTester = (): { tester: Tester } => {
  const tester = new Tester();
  return { tester };
};

global.setupTester = setupTester;

declare global {
  var setupTester: () => { tester: Tester } ;
}
