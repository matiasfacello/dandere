const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  { ignores: ["dist/**", "node_modules/**", "drizzle/**", "**/*.cjs"] },
  js.configs.recommended,
  ...tseslint.configs["flat/recommended"],
  prettierConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 17,
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
];
