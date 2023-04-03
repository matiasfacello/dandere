/** @type {import("eslint").Linter.Config} */
const config = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  },
  plugins: ["@typescript-eslint"],
  root: true,
  exclude: ["dist"],
};

module.exports = config;
