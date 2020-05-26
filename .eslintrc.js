module.exports = {
  parser: `@typescript-eslint/parser`,
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:react/recommended"
  ],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  env: {
    browser: true,
    node: true,
  },
  rules: {
    quotes: ["error", "single"],
    indent: ["error", "tab"],
    semi: ["error", "always"],
    "max-len": [1, { code: 120 }],
    "ban-ts-ignore": 0,
    "@typescript-eslint/ban-ts-ignore": 0,
    "@typescript-eslint/interface-name-prefix": 0,
    "react/prop-types": [0],
    "@typescript-eslint/no-empty-interface": 0,
    "@typescript-eslint/camelcase": 0,
    "@typescript-eslint/no-var-requires": 0
  },
  settings: {
    react: {
      version: "detect"
    }
  }
}
