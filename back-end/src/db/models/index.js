"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const logger = require("../../utils/logger");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../../../config/config.js")[env];
const db = {};

const primaryPool = {
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
  acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
};

const baseOptions = {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: (message) => {
    logger.info(message);
  },
  timezone: "Europe/Sofia",
  dialectOptions: {
    timezone: "local",
  },
  pool: primaryPool,
};

// Whether a read replica is configured. `config.replica` is only populated by
// config/config.js when DB_HOST_REPLICA is set and the replica is enabled.
const replicaConfigured = !!(config.replica && config.replica.host);

const createDBConnection = () => {
  if (replicaConfigured) {
    // Use Sequelize's native read/write splitting. All SELECT queries are routed
    // to the read pool(s); everything else (INSERT/UPDATE/DELETE, transactions)
    // goes to the write pool (the primary). This requires no changes to any DAO.
    logger.info(
      `[db] Read replica enabled -> reads: ${config.replica.host}:${config.replica.port || config.port}, writes: ${config.host}:${config.port || 3306}`
    );
    return new Sequelize(config.database, null, null, {
      ...baseOptions,
      replication: {
        write: {
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
        },
        read: [
          {
            host: config.replica.host,
            port: config.replica.port,
            username: config.replica.username,
            password: config.replica.password,
            database: config.replica.database,
          },
        ],
      },
      // Replica pool sizing (used for the read pool); primary pool used for writes.
      pool: config.replica.pool || primaryPool,
    });
  }

  // Single-database (default) behaviour — unchanged.
  return new Sequelize(config.database, config.username, config.password, baseOptions);
};

const sequelize = createDBConnection();

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Multi-tenant model safety fallback.
//
// The tenant model is normally registered by the directory scan above (see
// src/db/models/tenant.js). This guarded block is a belt-and-suspenders fallback:
// if the tenant model is ever moved back under src/tenant-platform/models and is
// therefore not picked up by the scanner, it is registered here when
// TENANT_MODE=enabled so resolveTenant and tenant-platform services can access
// `db.tenant`. It is a no-op when `db.tenant` already exists.
if (process.env.TENANT_MODE === "enabled" && !db.tenant) {
  try {
    const tenantModelFactory = require("../../tenant-platform/models/tenant");
    const Tenant = tenantModelFactory(sequelize, Sequelize.DataTypes);
    db[Tenant.name] = Tenant;
    if (Tenant.associate) Tenant.associate(db);
    logger.info("[db] Tenant model registered via fallback (TENANT_MODE=enabled)");
  } catch (err) {
    logger.error("[db] Failed to register tenant model:", err.message);
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;
// Flag consumed by src/db/readReplica.js so reporting DAOs can decide whether to
// explicitly force a replica read (with primary fallback). When false, all read
// helpers transparently no-op back to the primary.
db.replicaConfigured = replicaConfigured;

module.exports = db;
