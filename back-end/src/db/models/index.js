"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const logger = require("../../utils/logger");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../../../config/config.js")[env];
const db = {};

const createDBConnection = () => {
  return new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: (message) => {
      logger.info(message);
    },
    timezone: "Europe/Sofia",
    dialectOptions: {
      timezone: "local",
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    },
  });
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

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
