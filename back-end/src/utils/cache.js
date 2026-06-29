const redis = require("redis");

let client = null;
let isConnected = false;

const shouldConnect = process.env.REDIS_HOST && process.env.REDIS_PORT;

if (shouldConnect) {
  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    },
  });

  client.on("error", (err) => {
    if (!isConnected) {
      console.warn("Redis connection failed, caching disabled");
    }
    console.error("Redis error:", err.message);
  });

  client.on("ready", () => {
    isConnected = true;
    console.log("Redis connected");
  });
}

const cache = {
  get: async (key) => {
    if (!isConnected || !client) return null;
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Cache get error:", err);
      return null;
    }
  },
  set: async (key, data, ttl = 300) => {
    if (!isConnected || !client) return;
    try {
      await client.setEx(key, ttl, JSON.stringify(data));
    } catch (err) {
      console.error("Cache set error:", err);
    }
  },
  del: async (key) => {
    if (!isConnected || !client) return;
    try {
      await client.del(key);
    } catch (err) {
      console.error("Cache del error:", err);
    }
  },
};

module.exports = { cache, client };
