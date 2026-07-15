const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), override: false });
require("dotenv").config({ path: path.resolve(__dirname, "../.env." + (process.env.NODE_ENV || "development")), override: true });

const dbSsl = process.env.DB_SSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : null;
const withSsl = (config) => (dbSsl ? { ...config, dialectOptions: dbSsl } : config);

module.exports = {
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
