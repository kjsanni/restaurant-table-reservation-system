const { client, getConnectionStatus } = require("./cache");

const CRON_LOCK_TTL = 300;

const acquireLock = async (key, ttl = CRON_LOCK_TTL) => {
  if (!getConnectionStatus()) {
    return { acquired: false, reason: "redis_unavailable" };
  }

  try {
    const result = await client.set(key, "1", {
      EX: ttl,
      NX: true,
    });
    return { acquired: result === "OK", reason: result === "OK" ? "acquired" : "already_held" };
  } catch (err) {
    return { acquired: false, reason: "error", error: err.message };
  }
};

const releaseLock = async (key) => {
  if (!getConnectionStatus()) {
    return { released: false, reason: "redis_unavailable" };
  }

  try {
    await client.del(key);
    return { released: true };
  } catch (err) {
    return { released: false, reason: "error", error: err.message };
  }
};

module.exports = {
  acquireLock,
  releaseLock,
  CRON_LOCK_TTL,
};
