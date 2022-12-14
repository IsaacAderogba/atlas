import { TokenType } from "./TokenType";

export const Keywords = new Map<string, TokenType>([
  ["break", "BREAK"],
  ["continue", "CONTINUE"],
  ["class", "CLASS"],
  ["else", "ELSE"],
  ["f", "FUNCTION"],
  ["for", "FOR"],
  ["from", "FROM"],
  ["if", "IF"],
  ["is", "IS"],
  ["interface", "INTERFACE"],
  ["implements", "IMPLEMENTS"],
  ["import", "IMPORT"],
  ["module", "MODULE"],
  ["panic", "PANIC"],
  ["return", "RETURN"],
  ["super", "SUPER"],
  ["this", "THIS"],
  ["type", "TYPE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);
