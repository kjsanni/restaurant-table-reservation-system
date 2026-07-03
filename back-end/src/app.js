const createServer = require("./utils/server");
const env = process.env.NODE_ENV || "development";
const { server_port } = require("../config/config")[env];
const logger = require("./utils/logger");
const connect = require("./utils/connect");
const { client: redisClient } = require("./utils/cache");

const { app, server } = createServer();

server.setTimeout(30000);

const init = async () => {
  try {
    await connect.connectDatabase();
    if (redisClient) {
      await redisClient.connect().catch((err) => {
        logger.warn("Redis connection failed, caching disabled:", err.message);
      });
    }
    server.listen(server_port, () => {
      logger.info(`Server is listening on PORT: ${server_port} 👂 ⬅`);
    });
  } catch (err) {
    await connect.closeConnection();
    logger.error("Error econuntered", err);
  }
};

init();