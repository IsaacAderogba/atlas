export const isAlphaNumeric = (char: string): boolean => {
  return isAlpha(char) || isDigit(char);
};

export const isAlpha = (char: string): boolean => {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char == "_";
};

export const isDigit = (char: string): boolean => {
  return char >= "0" && char <= "9";
};
