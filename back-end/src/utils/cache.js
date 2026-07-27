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

const cacheStats = {
  hits: 0,
  misses: 0,
  gets: 0,
};

const cache = {
  get: async (key) => {
    cacheStats.gets += 1;
    if (!isConnected || !client) {
      cacheStats.misses += 1;
      return null;
    }
    try {
      const data = await client.get(key);
      if (data) {
        cacheStats.hits += 1;
        return JSON.parse(data);
      }
      cacheStats.misses += 1;
      return null;
    } catch (err) {
      cacheStats.misses += 1;
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

const getCacheStats = () => ({ ...cacheStats });

const resetCacheStats = () => {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.gets = 0;
};

const closeClient = async () => {
  if (client && !client.isOpen) {
    return;
  }
  if (client) {
    try {
      await client.quit();
    } catch (err) {
      if (err.message && !err.message.includes("The client is closed")) {
        console.warn("[Cache] Failed to close Redis client:", err.message);
      }
    }
  }
};

module.exports = { cache, client, closeClient, getCacheStats, resetCacheStats };
