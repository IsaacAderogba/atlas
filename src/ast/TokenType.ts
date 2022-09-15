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
  | "HASH"
  | "PIPE"
  | "AMPERSAND"

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
  | "BREAK"
  | "CONTINUE"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUNCTION"
  | "FOR"
  | "IF"
  | "INTERFACE"
  | "NULL"
  | "OR"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "TYPE"
  | "VAR"
  | "WHILE"

  // End of file.
  | "EOF";
