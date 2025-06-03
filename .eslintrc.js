module.exports = {
  "env": {
    "node": true,
    "es2021": true,
    "jest/globals": true
  },
  "plugins": ["jest", "node"],
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:node/recommended"
  ],
  "rules": {
    "node/no-deprecated-api": "error",
    "no-console": "warn"
  }
}
