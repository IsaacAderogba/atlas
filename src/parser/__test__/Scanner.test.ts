import { Errors } from "../../utils/Errors";
import { Scanner } from "../Scanner";

const setupTests = (source: string): { scanner: Scanner } => {
  const scanner = new Scanner(source);
  return { scanner };
};

describe("Scanner tokens", () => {
  // todo
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
