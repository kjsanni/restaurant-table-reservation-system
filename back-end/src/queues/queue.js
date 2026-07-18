const { Queue } = require("bullmq");
const { client } = require("../utils/cache");

const shouldConnect = process.env.REDIS_HOST && process.env.REDIS_PORT;

const connection = shouldConnect
  ? {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    }
  : undefined;

const createQueue = (name) => {
  if (!connection) {
    return null;
  }
  return new Queue(name, { connection });
};

const notificationQueue = createQueue("notifications");
const reportQueue = createQueue("reports");

module.exports = {
  connection,
  notificationQueue,
  reportQueue,
  createQueue,
};
