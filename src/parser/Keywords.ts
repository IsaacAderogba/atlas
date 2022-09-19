import { TokenType } from "../ast/TokenType";

export const Keywords = new Map<string, TokenType>([
  ["and", "AND"],
  ["break", "BREAK"],
  ["continue", "CONTINUE"],
  ["class", "CLASS"],
  ["else", "ELSE"],
  ["for", "FOR"],
  ["f", "FUNCTION"],
  ["if", "IF"],
  ["is", "IS"],
  ["interface", "INTERFACE"],
  ["implements", "IMPLEMENTS"],
  ["or", "OR"],
  ["return", "RETURN"],
  ["super", "SUPER"],
  ["this", "THIS"],
  ["type", "TYPE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);
