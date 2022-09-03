import { TokenType } from "../ast/TokenType";

export const Keywords = new Map<string, TokenType>([
  ["and", "AND"],
  ["break", "BREAK"],
  ["class", "CLASS"],
  ["else", "ELSE"],
  ["for", "FOR"],
  ["fun", "FUN"],
  ["if", "IF"],
  ["or", "OR"],
  ["print", "PRINT"],
  ["return", "RETURN"],
  ["super", "SUPER"],
  ["this", "THIS"],
  ["type", "TYPE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);
