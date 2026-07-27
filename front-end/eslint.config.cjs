const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const vueParser = require("vue-eslint-parser");
const vuePlugin = require("eslint-plugin-vue");
const prettierPlugin = require("@vue/eslint-config-prettier");

module.exports = [
  ...vuePlugin.configs["flat/essential"],
  {
    files: ["**/*.vue", "**/*.ts", "**/*.js"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 13,
      },
      globals: {
        defineOptions: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      vue: vuePlugin,
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
      "vue/valid-define-props": "off",
      "vue/valid-define-emits": "off",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
  prettierPlugin,
];
