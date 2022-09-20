import { describe, it, expect } from "vitest";
import { SyntaxErrors } from "../../errors/SyntaxError";
import { Parser } from "../Parser";
import { Scanner } from "../Scanner";

const setupTests = (source: string): { parser: Parser } => {
  const scanner = new Scanner(source);
  const { tokens } = scanner.scan();
  const parser = new Parser(tokens);

  return { parser };
};

describe("Parser statements", () => {
  it("parses class declaration statements", () => {
    const { parser } = setupTests("class Foo {}");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      close: { lexeme: "}", type: "RIGHT_BRACE" },
      properties: [],
      keyword: { lexeme: "class", type: "CLASS" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
      open: { lexeme: "{", type: "LEFT_BRACE" },
    });
  });

  it("parses variable declaration statements", () => {
    const { parser } = setupTests("var x = 4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "var", type: "VAR" },
      property: {
        initializer: {
          token: { lexeme: "4", type: "NUMBER" },
        },
        name: { lexeme: "x", type: "IDENTIFIER" },
      },
    });
  });

  it("parses return statements", () => {
    const { parser } = setupTests("return 4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "return", type: "RETURN" },
      value: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses break statements", () => {
    const { parser } = setupTests("break");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "break", type: "BREAK" },
    });
  });

  it("parses continue statements", () => {
    const { parser } = setupTests("continue;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "continue", type: "CONTINUE" },
    });
  });

  it("parses while condition statements", () => {
    const { parser } = setupTests("while (4 + 4) 4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "while", type: "WHILE" },
      body: {
        expression: {
          token: { lexeme: "4", type: "NUMBER" },
        },
      },
      condition: {
        left: {
          token: { lexeme: "4", type: "NUMBER" },
        },
        operator: { lexeme: "+", type: "PLUS" },
        right: {
          token: { lexeme: "4", type: "NUMBER" },
        },
      },
    });
  });

  it("parses if statements", () => {
    const { parser } = setupTests("if (4 + 4) 4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "if", type: "IF" },
      condition: {
        left: {
          token: { lexeme: "4", type: "NUMBER" },
        },
        operator: { lexeme: "+", type: "PLUS" },
        right: {
          token: { lexeme: "4", type: "NUMBER" },
        },
      },
      elseBranch: undefined,
      thenBranch: {
        expression: {
          token: { lexeme: "4", type: "NUMBER" },
        },
      },
    });
  });

  it("parses block statements", () => {
    const { parser } = setupTests("{ var x = 4 }");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      open: { lexeme: "{", type: "LEFT_BRACE" },
      statements: [
        {
          keyword: {},
          property: {},
        },
      ],
      close: { lexeme: "}", type: "RIGHT_BRACE" },
    });
  });

  it("parses expression statements", () => {
    const { parser } = setupTests("4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      expression: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });
});

describe("Parser expressions", () => {
  it("parses assignment expressions", () => {
    const { parser } = setupTests("hid = 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      name: { lexeme: "hid", type: "IDENTIFIER" },
      value: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses get expressions", () => {
    const { parser } = setupTests("foo.y");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      name: { lexeme: "y", type: "IDENTIFIER" },
      object: {
        name: { lexeme: "foo", type: "IDENTIFIER" },
      },
    });
  });

  it("parses set expressions", () => {
    const { parser } = setupTests('foo.y = "hi"');

    const expression = parser.expression();
    expect(expression).toMatchObject({
      name: { lexeme: "y", type: "IDENTIFIER" },
      object: {
        name: { lexeme: "foo", type: "IDENTIFIER" },
      },
      value: {
        token: { lexeme: '"hi"', type: "STRING" },
      },
    });
  });

  it("parses ternary expressions", () => {
    const { parser } = setupTests("true ? 4 : 3");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      expression: {
        token: { lexeme: "true", type: "TRUE" },
      },
      thenBranch: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      elseBranch: {
        token: { lexeme: "3", type: "NUMBER" },
      },
    });
  });

  it("parses or expressions", () => {
    const { parser } = setupTests("true || false");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "true", type: "TRUE" },
      },
      operator: { lexeme: "||", type: "PIPE_PIPE" },
      right: {
        token: { lexeme: "false", type: "FALSE" },
      },
    });
  });

  it("parses and expressions", () => {
    const { parser } = setupTests("true && false");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "true", type: "TRUE" },
      },
      operator: { lexeme: "&&", type: "AMPERSAND_AMPERSAND" },
      right: {
        token: { lexeme: "false", type: "FALSE" },
      },
    });
  });

  it("parses equality expressions", () => {
    const { parser } = setupTests("4 == 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      operator: { lexeme: "==", type: "EQUAL_EQUAL" },
      right: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses comparison expressions", () => {
    const { parser } = setupTests("4 > 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      operator: { lexeme: ">", type: "GREATER" },
      right: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses term expressions", () => {
    const { parser } = setupTests("4 - 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      operator: { lexeme: "-", type: "MINUS" },
      right: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses factor expressions", () => {
    const { parser } = setupTests("4 / 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      operator: { lexeme: "/", type: "SLASH" },
      right: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses unary expressions", () => {
    const { parser } = setupTests("!true");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      operator: { lexeme: "!", type: "BANG" },
      right: {
        token: { lexeme: "true", type: "TRUE" },
      },
    });
  });

  it("parses call expressions", () => {
    const { parser } = setupTests("sayHi()");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      args: [],
      callee: {
        name: { lexeme: "sayHi", type: "IDENTIFIER" },
      },
      close: { lexeme: ")", type: "RIGHT_PAREN" },
    });
  });

  it("parses grouping expressions", () => {
    const { parser } = setupTests("(4 + 4)");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      open: { lexeme: "(", type: "LEFT_PAREN" },
      expression: {
        left: {
          token: { lexeme: "4", type: "NUMBER" },
        },
        operator: { lexeme: "+", type: "PLUS" },
        right: {
          token: { lexeme: "4", type: "NUMBER" },
        },
      },
      close: { lexeme: ")", type: "RIGHT_PAREN" },
    });
  });

  it("parses parameter expressions", () => {
    const { parser } = setupTests("sayHi(param)");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      args: [
        {
          name: { lexeme: "param", type: "IDENTIFIER" },
        },
      ],
    });
  });

  it("parses this expressions", () => {
    const { parser } = setupTests("this");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      keyword: { lexeme: "this", type: "THIS" },
    });
  });

  it("parses primary expressions", () => {
    const { parser } = setupTests("'passes'");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      token: { lexeme: "'passes'", type: "STRING" },
    });
  });

  it("parses function expressions", () => {
    const { parser } = setupTests("f() {}");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      keyword: { lexeme: "f", type: "FUNCTION" },
      body: { statements: [] },
      params: [],
    });
  });

  it("parses error expressions", () => {
    const { parser } = setupTests("+ 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      error: {
        sourceMessage: {},
        sourceRange: {},
      },
    });
  });
});

describe("Parser errors", () => {
  it("errors with expected colon", () => {
    const { parser } = setupTests("4 == 4 ? 3");

    const { errors } = parser.parse();
    expect(errors[0].sourceMessage).toEqual(SyntaxErrors.expectedColon());
  });

  it("errors with expected left paren", () => {
    const expressions = ["if", "while", "f"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(SyntaxErrors.expectedLeftParen());
    });
  });

  it("errors with expected right paren", () => {
    const expressions = ["( 4 + 4", "if (4 == 4", "while (4 == 4", "f (param"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(
        SyntaxErrors.expectedRightParen()
      );
    });
  });

  it("errors with expected left operand", () => {
    const expressions = [
      "!= 4",
      "== 4",
      "> 4",
      ">= 4",
      "< 4",
      "<= 4",
      "+ 4",
      "# 'str'",
      "/ 4",
      "* 4",
      "|| 4",
      "&& 4",
    ];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(
        SyntaxErrors.expectedLeftOperand()
      );
    });
  });

  it("errors with expected parameter", () => {
    const tests = ["f ("];
    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(SyntaxErrors.expectedParameter());
    });
  });

  it("errors with expected identifier", () => {
    const tests = ["var", "class", "foo."];
    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(
        SyntaxErrors.expectedIdentifier()
      );
    });
  });

  it("errors with expected assignment", () => {
    const { parser } = setupTests("var x");

    const { errors } = parser.parse();
    expect(errors[0].sourceMessage).toEqual(SyntaxErrors.expectedAssignment());
  });

  it("errors with expected left brace", () => {
    const tests = ["f()", "class Foo "];

    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(SyntaxErrors.expectedLeftBrace());
    });
  });

  it("errors with expected right brace", () => {
    const tests = ["{ var x = 5 ", "class Foo {"];

    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].sourceMessage).toEqual(
        SyntaxErrors.expectedRightBrace()
      );
    });
  });

  it("errors with invalid assignment target", () => {
    const { parser } = setupTests("4 = 4");

    const { errors } = parser.parse();
    expect(errors[0].sourceMessage).toEqual(
      SyntaxErrors.invalidAssignmentTarget()
    );
  });

  it("errors with invalid semicolon", () => {
    const { parser } = setupTests("4;");

    const { errors } = parser.parse();
    expect(errors[0].sourceMessage).toEqual(SyntaxErrors.invalidSemiColon());
  });
});

describe("Type statements", () => {
  it("parses interface statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow(
      "interface Foo { bar : String }"
    );
    expect(statements[0]).toMatchObject({
      close: { lexeme: "}", type: "RIGHT_BRACE" },
      entries: [
        {
          key: { lexeme: "bar", type: "IDENTIFIER" },
          value: {
            name: { lexeme: "String", type: "IDENTIFIER" },
          },
        },
      ],
      keyword: { lexeme: "interface", type: "INTERFACE" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
      open: { lexeme: "{", type: "LEFT_BRACE" },
    });
  });

  it("parses type statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("type Foo[T] = T");
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "type", type: "TYPE" },
      name: { lexeme: "Foo", type: "IDENTIFIER" },
      parameters: [
        {
          name: { lexeme: "T", type: "IDENTIFIER" },
        },
      ],
      type: {
        name: { lexeme: "T", type: "IDENTIFIER" },
      },
    });
  });

  it("parses composite statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("type Foo = Bar | Faz");
    expect(statements[0]).toMatchObject({
      type: {
        left: {
          name: { lexeme: "Bar", type: "IDENTIFIER" },
        },
        operator: { lexeme: "|", type: "PIPE" },
        right: {
          name: { lexeme: "Faz", type: "IDENTIFIER" },
        },
      },
    });
  });

  it("parses callable statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow(
      "type Foo = (Number) -> String"
    );
    expect(statements[0]).toMatchObject({
      type: {
        params: [],
        paramTypes: [{ name: { lexeme: "Number", type: "IDENTIFIER" } }],
        open: { lexeme: "(", type: "LEFT_PAREN" },
        returnType: {
          name: { lexeme: "String", type: "IDENTIFIER" },
        },
      },
    });
  });

  it("parses generic statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("type Foo = String[Bar]");
    expect(statements[0]).toMatchObject({
      type: {
        typeExprs: [
          {
            name: { lexeme: "Bar", type: "IDENTIFIER" },
          },
        ],
        name: { lexeme: "String", type: "IDENTIFIER" },
      },
    });
  });

  it("parses identifier statements", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("type Foo = String");
    expect(statements[0]).toMatchObject({
      parameters: [],
      type: {
        name: { lexeme: "String", type: "IDENTIFIER" },
      },
    });
  });
});

describe("Type annotations", () => {
  it("parses variable annotations", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("var foo: String = 'foo'");
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "var", type: "VAR" },
      property: {
        initializer: {
          token: {
            lexeme: "'foo'",
            literal: { type: "String", value: "foo" },
            type: "STRING",
          },
          value: {
            type: "String",
            value: "foo",
          },
        },
        name: { lexeme: "foo", type: "IDENTIFIER" },
        type: {
          name: { lexeme: "String", type: "IDENTIFIER" },
        },
      },
    });
  });

  it("parses call annotations", () => {
    const { tester } = setupTester();

    const { statements } = tester.parseWorkflow("foo[String]()");
    expect(statements[0]).toMatchObject({
      expression: {
        args: [],
        callee: {
          name: { lexeme: "foo", type: "IDENTIFIER" },
        },
        close: { lexeme: ")", type: "RIGHT_PAREN" },
        typeExprs: [
          {
            name: { lexeme: "String", type: "IDENTIFIER" },
          },
        ],
      },
    });
  });
});
