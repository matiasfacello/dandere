/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("@ianvs/prettier-plugin-sort-imports")],
  printWidth: 200,
  tabWidth: 2,
};

module.exports = config;
