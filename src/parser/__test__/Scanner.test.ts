import { TokenType } from "../../ast/TokenType";
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
    });
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
