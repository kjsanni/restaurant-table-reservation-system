const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), override: false });
require("dotenv").config({ path: path.resolve(__dirname, "../.env." + (process.env.NODE_ENV || "development")), override: true });

const REQUIRED_VARS = ["DB_HOST", "DB_NAME", "DB_USERNAME", "JWT_SECRET", "PORT"];

const validateEnv = (envName) => {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required environment variables for "${envName}": ${missing.join(", ")}`
    );
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    throw new Error("[config] JWT_SECRET must be at least 16 characters.");
  }
  return true;
};

const dbSsl = process.env.DB_SSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : null;
const withSsl = (config) => (dbSsl ? { ...config, dialectOptions: dbSsl } : config);

const environments = {
  development: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
  }),
  test: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
  }),
  production: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
  }),
};

const envName = process.env.NODE_ENV || "development";
validateEnv(envName);

module.exports = environments;
module.exports.validateEnv = validateEnv;
