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
      initializer: {
        token: { lexeme: "4", type: "NUMBER" },
      },
      name: { lexeme: "x", type: "IDENTIFIER" },
    });
  });

  it("parses while statements", () => {
    const { parser } = setupTests("while (4 + 4) 4;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
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
    const { parser } = setupTests("if (4 + 4) 4;");

    const { statements } = parser.parse();
    expect(statements[0]).toMatchObject({
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
      statements: [
        {
          initializer: {
            token: { lexeme: "4", type: "NUMBER" },
          },
          name: { lexeme: "x", type: "IDENTIFIER" },
        },
      ],
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

  it("parses primary expressions", () => {
    const { parser } = setupTests("'passes'");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      token: { lexeme: "'passes'", type: "STRING" },
    });
  });

  it("parses error expressions", () => {
    const { parser } = setupTests("+ 4");

    const expression = parser.expression();
    expect(expression).toMatchObject({
      error: {},
      token: { lexeme: "+", type: "PLUS" },
      expression: {
        token: { lexeme: "4", type: "NUMBER" },
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
    const expressions = ["if", "while"];

    expressions.forEach(expr => {
      const { parser } = setupTests(expr);

      const { errors } = parser.parse();
      expect(errors[0].message).toMatchObject(SyntaxErrors.expectedLeftParen());
    });
  });

  it("errors with expected right paren", () => {
    const expressions = ["( 4 + 4", "if (4 == 4", "while (4 == 4"];

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
    const { parser } = setupTests("4 +");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedExpression());
  });

  it("errors with expected identifier", () => {
    const { parser } = setupTests("var ");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedIdentifier());
  });

  it("errors with expected assignment", () => {
    const { parser } = setupTests("var x");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedAssignment());
  });

  it("errors with expected semicolon", () => {
    const { parser } = setupTests("var x = null");

    const { errors } = parser.parse();
    expect(errors[0].message).toMatchObject(SyntaxErrors.expectedSemiColon());
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
