import { describe, it, expect } from "vitest";
import { TokenType } from "../../ast/TokenType";
import { SyntaxErrors } from "../../errors/SyntaxError";
import { atlasBoolean } from "../../primitives/AtlasBoolean";
import { AtlasNull } from "../../primitives/AtlasNull";
import { AtlasNumber } from "../../primitives/AtlasNumber";
import { AtlasString } from "../../primitives/AtlasString";
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
      { char: "[", type: "LEFT_BRACKET" },
      { char: "]", type: "RIGHT_BRACKET" },
      { char: "|", type: "PIPE" },
      { char: "&", type: "AMPERSAND" },
      { char: ",", type: "COMMA" },
      { char: ".", type: "DOT" },
      { char: "-", type: "MINUS" },
      { char: "+", type: "PLUS" },
      { char: ";", type: "SEMICOLON" },
      { char: "*", type: "STAR" },
      { char: "/", type: "SLASH" },
      { char: "?", type: "QUESTION" },
      { char: ":", type: "COLON" },
      { char: "#", type: "HASH" },
      { char: "!", type: "BANG" },
      { char: "=", type: "EQUAL" },
      { char: "<", type: "LESS" },
      { char: ">", type: "GREATER" },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scan();
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
      const { tokens } = scanner.scan();
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
      const { tokens } = scanner.scan();
      expect(tokens[0].type).toEqual(type);
      expect(tokens.length).toEqual(1);
    });
  });

  it("tokenizes keywords and identifiers", () => {
    const charTypes: { char: string; type: TokenType }[] = [
      { char: "and", type: "AND" },
      { char: "break", type: "BREAK" },
      { char: "continue", type: "CONTINUE" },
      { char: "class", type: "CLASS" },
      { char: "else", type: "ELSE" },
      { char: "for", type: "FOR" },
      { char: "f", type: "FUNCTION" },
      { char: "if", type: "IF" },
      { char: "or", type: "OR" },
      { char: "return", type: "RETURN" },
      { char: "super", type: "SUPER" },
      { char: "this", type: "THIS" },
      { char: "type", type: "TYPE" },
      { char: "var", type: "VAR" },
      { char: "while", type: "WHILE" },
      { char: "identifier", type: "IDENTIFIER" },
      { char: "interface", type: "INTERFACE" },
      { char: "implements", type: "IMPLEMENTS" },
    ];

    charTypes.forEach(({ char, type }) => {
      const { scanner } = setupTests(char);
      const { tokens } = scanner.scan();
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
      const { tokens } = scanner.scan();
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
      const { tokens } = scanner.scan();
      expect(tokens[0].type).toEqual(type);
      expect(tokens[0].literal).toEqual(literal);

      expect(tokens.length).toEqual(2);
    });
  });

  it("tokenizes true", () => {
    const { scanner } = setupTests("true");
    const { tokens } = scanner.scan();

    expect(tokens[0].type).toEqual("TRUE");
    expect(tokens[0].literal).toEqual(atlasBoolean(true));

    expect(tokens.length).toEqual(2);
  });

  it("tokenizes false", () => {
    const { scanner } = setupTests("false");
    const { tokens } = scanner.scan();

    expect(tokens[0].type).toEqual("FALSE");
    expect(tokens[0].literal).toEqual(atlasBoolean(false));

    expect(tokens.length).toEqual(2);
  });

  it("tokenizes null", () => {
    const { scanner } = setupTests("null");
    const { tokens } = scanner.scan();

    expect(tokens[0].type).toEqual("NULL");
    expect(tokens[0].literal).toEqual(new AtlasNull());

    expect(tokens.length).toEqual(2);
  });
});

describe("Scanner errors", () => {
  it("errors with unsupported character", () => {
    const { scanner } = setupTests("£");

    const { errors } = scanner.scan();
    expect(errors[0].sourceMessage).toMatchObject(SyntaxErrors.unsupportedCharacter());
  });

  it("errors with unterminated string", () => {
    const { scanner } = setupTests('"Hello');

    const { errors } = scanner.scan();
    expect(errors[0].sourceMessage).toMatchObject(SyntaxErrors.unterminatedString());
  });

  it("cascades multiple errors", () => {
    const { scanner } = setupTests('£"Hello');

    const { errors } = scanner.scan();

    expect(errors[0].sourceMessage).toMatchObject(SyntaxErrors.unsupportedCharacter());
    expect(errors[1].sourceMessage).toMatchObject(SyntaxErrors.unterminatedString());
  });
});
