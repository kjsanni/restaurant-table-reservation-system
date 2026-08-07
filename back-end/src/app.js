const env = process.env.NODE_ENV || "development";
const { server_port } = require("../config/config")[env];
const createServer = require("./utils/server");
const logger = require("./utils/logger");
const connect = require("./utils/connect");
const { client: redisClient } = require("./utils/cache");

const init = async () => {
  try {
    if (redisClient) {
      await redisClient.connect().catch((err) => {
        logger.error("Redis connection failed:", err.message);
        console.error("Redis connection failed:", err.message);
        process.exit(1);
      });
    }
    await connect.connectDatabase();

    const { server } = createServer();
    server.setTimeout(30000);

    server.listen(server_port, () => {
      logger.info(`Server is listening on PORT: ${server_port} 👂 ⬅`);
    });
  } catch (err) {
    await connect.closeConnection();
    logger.error("Error encountered", err);
    if (err instanceof Error) {
      console.error(err.stack);
    } else {
      console.error(JSON.stringify(err, null, 2));
    }
    process.exit(1);
  }
};

init();