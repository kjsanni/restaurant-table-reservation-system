const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), override: false });
require("dotenv").config({ path: path.resolve(__dirname, "../.env." + (process.env.NODE_ENV || "development")), override: true });

const REQUIRED_VARS = ["DB_HOST", "DB_NAME", "DB_USERNAME", "JWT_SECRET", "PORT"];
const PROD_REQUIRED_VARS = ["FRONTEND_URL", "API_URL", "CORS_ORIGINS"];

const validateEnv = (envName) => {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required environment variables for "${envName}": ${missing.join(", ")}`
    );
  }
  if (envName === "production") {
    const prodMissing = PROD_REQUIRED_VARS.filter((v) => !process.env[v]);
    if (prodMissing.length > 0) {
      throw new Error(
        `[config] Missing required production environment variables: ${prodMissing.join(", ")}`
      );
    }
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    throw new Error("[config] JWT_SECRET must be at least 16 characters.");
  }
  return true;
};

const dbSsl = process.env.DB_SSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : null;
const withSsl = (config) => (dbSsl ? { ...config, dialectOptions: dbSsl } : config);

// Read replica configuration.
//
// A replica is considered "configured" only when DB_HOST_REPLICA is set. When it
// is not set, `replica` resolves to `null` and the application keeps its existing
// single-database behaviour untouched (fully backward compatible).
//
// Replica credentials fall back to the primary credentials when the replica-
// specific variable is omitted, which is the common case where the replica shares
// the same user/password/schema as the primary (typical for native MySQL
// replication).
const replicaEnabled = process.env.DB_REPLICA_ENABLED !== "false"; // default on when host provided
const hasReplicaHost = !!process.env.DB_HOST_REPLICA;

const buildReplica = (database) => {
  if (!hasReplicaHost || !replicaEnabled) return null;
  return {
    host: process.env.DB_HOST_REPLICA,
    port: process.env.DB_PORT_REPLICA || process.env.DB_PORT,
    username: process.env.DB_USERNAME_REPLICA || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD_REPLICA || process.env.DB_PASSWORD,
    database,
    // Replica pool is sized independently: read-heavy workloads usually want a
    // larger read pool than the write pool. Falls back to the primary pool sizing.
    pool: {
      min: parseInt(process.env.DB_POOL_MIN_REPLICA, 10) || parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX_REPLICA, 10) || parseInt(process.env.DB_POOL_MAX, 10) || 20,
      idle: parseInt(process.env.DB_POOL_IDLE_REPLICA, 10) || parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE_REPLICA, 10) || parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    },
  };
};

const environments = {
  development: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
    replica: buildReplica(process.env.DB_NAME),
  }),
  test: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
    // Replica is intentionally disabled for the test environment so the existing
    // test suite always runs against a single database.
    replica: null,
  }),
  production: withSsl({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT,
    server_port: process.env.PORT,
    replica: buildReplica(process.env.DB_NAME),
  }),
};

const envName = process.env.NODE_ENV || "development";
validateEnv(envName);

module.exports = environments;
module.exports.validateEnv = validateEnv;
