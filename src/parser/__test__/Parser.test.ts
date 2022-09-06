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
  it("parses variable declaration statements", () => {
    const { parser } = setupTests("var x = 4;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "var", type: "VAR" },
      field: {
        initializer: {
          token: { lexeme: "4", type: "NUMBER" },
        },
        name: { lexeme: "x", type: "IDENTIFIER" },
      },
    });
  });

  it("parses return statements", () => {
    const { parser } = setupTests("return 4;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "return", type: "RETURN" },
      value: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses break statements", () => {
    const { parser } = setupTests("break;");

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
    const { parser } = setupTests("while (4 + 4) 4;");

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

  it("parses while increment statements", () => {
    const { parser } = setupTests("while (4 + 4; 4) {}");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      keyword: { lexeme: "while", type: "WHILE" },
      body: { statements: [] },
      increment: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses if statements", () => {
    const { parser } = setupTests("if (4 + 4) 4;");

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
    const { parser } = setupTests("{ var x = 4; }");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      open: { lexeme: "{", type: "LEFT_BRACE" },
      statements: [
        {
          keyword: {},
          field: {},
        },
      ],
      close: { lexeme: "}", type: "RIGHT_BRACE" },
    });
  });

  it("parses expression statements", () => {
    const { parser } = setupTests("4;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      expression: {
        token: { lexeme: "4", type: "NUMBER" },
      },
    });
  });

  it("parses error statements", () => {
    const { parser } = setupTests("4");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
      error: {
        message: {},
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
    const { parser } = setupTests("true or false");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "true", type: "TRUE" },
      },
      operator: { lexeme: "or", type: "OR" },
      right: {
        token: { lexeme: "false", type: "FALSE" },
      },
    });
  });

  it("parses and expressions", () => {
    const { parser } = setupTests("true and false");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      left: {
        token: { lexeme: "true", type: "TRUE" },
      },
      operator: { lexeme: "and", type: "AND" },
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
      open: { lexeme: "(", type: "LEFT_PAREN" },
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
        message: {},
        sourceRange: {},
      },
    });
  });
});

describe("Parser errors", () => {
  it("errors with expected colon", () => {
    const { parser } = setupTests("4 == 4 ? 3");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedColon());
  });

  it("errors with expected left paren", () => {
    const expressions = ["if", "while", "f"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(SyntaxErrors.expectedLeftParen());
    });
  });

  it("errors with expected right paren", () => {
    const expressions = [
      "( 4 + 4",
      "if (4 == 4",
      "while (4 == 4",
      "while (4 == 4; 4;",
      "while (4 == 4; true ? true : false",
      "f (param",
    ];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(
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
      "or 4",
      "and 4",
    ];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(
        SyntaxErrors.expectedLeftOperand()
      );
    });
  });

  it("errors with expected expression", () => {
    const expressions = ["4 +", "while (true;) {}"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(
        SyntaxErrors.expectedExpression()
      );
    });
  });

  it("errors with expected parameter", () => {
    const tests = ["f ("];
    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(SyntaxErrors.expectedParameter());
    });
  });

  it("errors with expected identifier", () => {
    const tests = ["var"];
    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(
        SyntaxErrors.expectedIdentifier()
      );
    });
  });

  it("errors with expected assignment", () => {
    const { parser } = setupTests("var x");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedAssignment());
  });

  it("errors with expected semicolon", () => {
    const expressions = [
      "var x = null",
      "while(true) break",
      "while(true) continue",
      "f() { return 4 }",
    ];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(SyntaxErrors.expectedSemiColon());
    });
  });

  it("errors with expected left brace", () => {
    const tests = ["f()"];

    tests.forEach(test => {
      const { parser } = setupTests(test);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(SyntaxErrors.expectedLeftBrace());
    });
  });

  it("errors with expected right brace", () => {
    const { parser } = setupTests("{ var x = 5; ");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedRightBrace());
  });

  it("errors with invalid assignment target", () => {
    const { parser } = setupTests("4 = 4;");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(
      SyntaxErrors.invalidAssignmentTarget()
    );
  });
});
