export type TokenType =
  // Single-character tokens.
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "LEFT_BRACKET"
  | "RIGHT_BRACKET"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  | "COLON"
  | "QUESTION"

  // One or two character tokens.
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"

  // Literals.
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"

  // Keywords.
  | "AND"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUN"
  | "FOR"
  | "IF"
  | "NULL"
  | "OR"
  | "PRINT"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "TYPE"
  | "VAR"
  | "WHILE"

  // End of line or file.
  | "EOL"
  | "EOF";
