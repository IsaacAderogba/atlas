import { TokenType } from "../../ast/TokenType";
import { AtlasFalse } from "../../runtime/AtlasFalse";
import { AtlasNull } from "../../runtime/AtlasNull";
import { AtlasNumber } from "../../runtime/AtlasNumber";
import { AtlasString } from "../../runtime/AtlasString";
import { AtlasTrue } from "../../runtime/AtlasTrue";
// import { AtlasValue } from "../../runtime/AtlasValue";
import { Errors } from "../../utils/Errors";
import { Scanner } from "../Scanner";

const setupTests = (source: string): { scanner: Scanner } => {
  const scanner = new Scanner(source);
  return { scanner };
};

describe("Scanner tokens", () => {
  it("tokenizes single-character tokens", () => {
    const charTypes: { char: string; type: TokenType }[] = [
      { char: "(", type: "LEFT_PAREN" },
      { char: ")", type: "RIGHT_PAREN" },
      { char: "{", type: "LEFT_BRACE" },
      { char: "}", type: "RIGHT_BRACE" },
      { char: ",", type: "COMMA" },
      { char: ".", type: "DOT" },
      { char: "-", type: "MINUS" },
      { char: "+", type: "PLUS" },
      { char: ";", type: "SEMICOLON" },
      { char: "*", type: "STAR" },
      { char: "/", type: "SLASH" },
      { char: "!", type: "BANG" },
      { char: "=", type: "EQUAL" },
      { char: "<", type: "LESS" },
      { char: ">", type: "GREATER" },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens.length).toEqual(2);
    });
  });

  it("tokenizes double-character tokens", () => {
    const charTypes: { char: string; type: TokenType }[] = [
      { char: "!=", type: "BANG_EQUAL" },
      { char: "==", type: "EQUAL_EQUAL" },
      { char: "<=", type: "LESS_EQUAL" },
      { char: ">=", type: "GREATER_EQUAL" },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens.length).toEqual(2);
    });
  });

  it("ignores white space and comments", () => {
    const charTypes: { char: string; type: TokenType }[] = [
      { char: " ", type: "EOF" },
      { char: "\r", type: "EOF" },
      { char: "\t", type: "EOF" },
      { char: "\n", type: "EOF" },
      { char: "// comment", type: "EOF" },
      { char: "/* block comment */", type: "EOF" },
      {
        char: `/*
                * block comment 
                */`,
        type: "EOF",
      },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens.length).toEqual(1);
    });
  });

  it("tokenizes keywords and identifiers", () => {
    const charTypes: { char: string; type: TokenType }[] = [
      { char: "and", type: "AND" },
      { char: "class", type: "CLASS" },
      { char: "else", type: "ELSE" },
      { char: "for", type: "FOR" },
      { char: "fun", type: "FUN" },
      { char: "if", type: "IF" },
      { char: "or", type: "OR" },
      { char: "print", type: "PRINT" },
      { char: "return", type: "RETURN" },
      { char: "super", type: "SUPER" },
      { char: "this", type: "THIS" },
      { char: "type", type: "TYPE" },
      { char: "var", type: "VAR" },
      { char: "while", type: "WHILE" },
      { char: "identifier", type: "IDENTIFIER" },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens.length).toEqual(2);
    });
  });

  it("tokenizes string", () => {
    const charTypes: { char: string; type: TokenType; literal: AtlasString }[] = [
      { char: '"string"', type: "STRING", literal: new AtlasString("string") },
      { char: "'string'", type: "STRING", literal: new AtlasString("string") },
    ];

    charTypes.forEach(({ char, type, literal }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens[0].literal).toEqual(literal);

      expect(tokens.length).toEqual(2);
    });
  });

  it("tokenizes number", () => {
    const charTypes: { char: string; type: TokenType; literal: AtlasNumber }[] = [
      { char: "2", type: "NUMBER", literal: new AtlasNumber(2) },
      { char: "2.2", type: "NUMBER", literal: new AtlasNumber(2.2) },
    ];

    charTypes.forEach(({ char, type, literal }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scanTokens();
      expect(tokens[0].type).toEqual(type);
      expect(tokens[0].literal).toEqual(literal);

      expect(tokens.length).toEqual(2);
    });
  });

  it("tokenizes true", () => {
    const { scanner } = setupTests("true");
    const { tokens } = scanner.scanTokens();

    expect(tokens[0].type).toEqual("TRUE");
    expect(tokens[0].literal).toEqual(new AtlasTrue());

    expect(tokens.length).toEqual(2);
  });

  it("tokenizes false", () => {
    const { scanner } = setupTests("false");
    const { tokens } = scanner.scanTokens();

    expect(tokens[0].type).toEqual("FALSE");
    expect(tokens[0].literal).toEqual(new AtlasFalse());

    expect(tokens.length).toEqual(2);
  });

  it("tokenizes null", () => {
    const { scanner } = setupTests("null");
    const { tokens } = scanner.scanTokens();

    expect(tokens[0].type).toEqual("NULL");
    expect(tokens[0].literal).toEqual(new AtlasNull());

    expect(tokens.length).toEqual(2);
  });
});

describe("Scanner errors", () => {
  it("errors with unexpected character", () => {
    const { scanner } = setupTests("£");

    const { errors } = scanner.scanTokens();
    expect(errors[0].message).toEqual(Errors.UnexpectedCharacter);
  });

  it("errors with unterminated string", () => {
    const { scanner } = setupTests('"Hello');

    const { errors } = scanner.scanTokens();
    expect(errors[0].message).toEqual(Errors.UnterminatedString);
  });

  it("cascades multiple errors", () => {
    const { scanner } = setupTests('£"Hello');

    const { errors } = scanner.scanTokens();

    expect(errors[0].message).toEqual(Errors.UnexpectedCharacter);
    expect(errors[1].message).toEqual(Errors.UnterminatedString);
  });
});
