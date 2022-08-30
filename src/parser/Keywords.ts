import { TokenType } from "../ast/TokenType";

export const Keywords = new Map<string, TokenType>([
  ["and", "AND"],
  ["class", "CLASS"],
  ["else", "ELSE"],
  ["false", "FALSE"],
  ["for", "FOR"],
  ["fun", "FUN"],
  ["if", "IF"],
  ["nil", "NIL"],
  ["or", "OR"],
  ["print", "PRINT"],
  ["return", "RETURN"],
  ["super", "SUPER"],
  ["this", "THIS"],
  ["true", "TRUE"],
  ["type", "TYPE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);
