/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-essential",
    "@vue/eslint-config-prettier",
  ],
  parserOptions: {
    ecmaVersion: 13,
    parser: "@typescript-eslint/parser",
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
  globals: {
    defineOptions: "readonly",
    process: "readonly",
  },
};
