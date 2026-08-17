const path = require("path");

const BASE_ENV = { ...process.env };

const resetEnv = (overrides = {}) => {
  process.env = { ...BASE_ENV };
  Object.assign(process.env, overrides);
  jest.resetModules();
};

const without = (keys) => {
  for (const key of keys) {
    delete process.env[key];
  }
};

jest.mock("dotenv", () => ({
  config: jest.fn(() => ({})),
}));

describe("config validation", () => {
  afterEach(() => {
    process.env = { ...BASE_ENV };
    jest.resetModules();
  });

  it("throws when JWT_SECRET is missing", () => {
    resetEnv({
      NODE_ENV: "development",
      DB_HOST: "127.0.0.1",
      DB_NAME: "reserve",
      DB_USERNAME: "reserve",
      DB_PASSWORD: "reserve",
      PORT: "8000",
    });
    without(["JWT_SECRET"]);
    jest.isolateModules(() => {
      expect(() => require(path.resolve(__dirname, "../../config/config"))).toThrow(
        /Missing required environment variables for "development": JWT_SECRET/
      );
    });
  });

  it("throws when JWT_SECRET is too short", () => {
    resetEnv({
      NODE_ENV: "development",
      DB_HOST: "127.0.0.1",
      DB_NAME: "reserve",
      DB_USERNAME: "reserve",
      DB_PASSWORD: "reserve",
      PORT: "8000",
      JWT_SECRET: "short",
    });
    jest.isolateModules(() => {
      expect(() => require(path.resolve(__dirname, "../../config/config"))).toThrow(
        /JWT_SECRET must be at least 16 characters/
      );
    });
  });

  it("throws in production when FRONTEND_URL is missing", () => {
    resetEnv({
      NODE_ENV: "production",
      DB_HOST: "127.0.0.1",
      DB_NAME: "rtrs_production",
      DB_USERNAME: "rtrs_user",
      DB_PASSWORD: "real-production-password",
      PORT: "8000",
      JWT_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
       API_URL: "http://192.168.88.10",
       CORS_ORIGINS: "http://192.168.88.10",
     });
     without(["FRONTEND_URL"]);
    jest.isolateModules(() => {
      expect(() => require(path.resolve(__dirname, "../../config/config"))).toThrow(
        /Missing required production environment variables: FRONTEND_URL/
      );
    });
  });

  it("throws in production when a known placeholder value is present", () => {
    resetEnv({
      NODE_ENV: "production",
      DB_HOST: "127.0.0.1",
      DB_NAME: "rtrs_production",
      DB_USERNAME: "rtrs_user",
      DB_PASSWORD: "real-production-password",
      PORT: "8000",
      JWT_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      FRONTEND_URL: "http://192.168.88.10",
      API_URL: "http://192.168.88.10",
      CORS_ORIGINS: "http://192.168.88.10",
      SENTRY_DSN: "examplePublicKey@o0.ingest.sentry.io/0000000",
      APP_URL: "your-domain.com",
    });
    jest.isolateModules(() => {
      expect(() => require(path.resolve(__dirname, "../../config/config"))).toThrow(
        /Placeholder value detected for (SENTRY_DSN|APP_URL) in production/
      );
    });
  });

  it("passes in development with valid env", () => {
    resetEnv({
      NODE_ENV: "development",
      DB_HOST: "127.0.0.1",
      DB_NAME: "reserve",
      DB_USERNAME: "reserve",
      DB_PASSWORD: "reserve",
      PORT: "8000",
      JWT_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    jest.isolateModules(() => {
      expect(() => require(path.resolve(__dirname, "../../config/config"))).not.toThrow();
    });
  });
});
