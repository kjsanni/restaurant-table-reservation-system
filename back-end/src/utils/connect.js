const db = require("../db/models");
const logger = require("./logger");

const connectDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info("Database connection is established!");
  } catch {
    logger.error("Couldn't connect to DB: ");
    process.exit(1);
  }
};

// Use syncModels() only when u don't use migrations.
const closeConnection = async () => {
  try {
    await db.sequelize.close();
  } catch (err) {
    logger.error("Couldn't close DB connection: ", err.message);
  }
};

module.exports = {
  connectDatabase,
  closeConnection,
};
