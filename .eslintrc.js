module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": 2,
    "@typescript-eslint/no-empty-interface": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/ban-types": 0
  },
};
