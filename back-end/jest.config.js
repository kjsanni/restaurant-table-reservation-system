const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  moduleNameMapper: {
    "^bullmq$": "<rootDir>/src/__mocks__/bullmq.js",
  },
  globalTeardown: "./src/queues/jest-teardown.js",
};
