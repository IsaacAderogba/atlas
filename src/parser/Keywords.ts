import { TokenType } from "../ast/TokenType";

export const Keywords = new Map<string, TokenType>([
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
  ["module", "MODULE"],
  ["return", "RETURN"],
  ["super", "SUPER"],
  ["this", "THIS"],
  ["type", "TYPE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);
