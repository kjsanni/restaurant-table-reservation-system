"use strict";

const { client, getConnectionStatus } = require("./cache");

const CircuitBreaker = {};

const STATES = { CLOSED: "closed", OPEN: "open", HALF_OPEN: "half_open" };

const defaultOptions = (name) => ({
  name,
  failureThreshold: 5,
  recoveryTimeout: 30000,
  halfOpenMaxRequests: 3,
  windowMs: 60000,
});

const getStateKey = (name) => `cb:state:${name}`;
const getFailureKey = (name) => `cb:fails:${name}`;
const getHalfOpenKey = (name) => `cb:half:${name}`;

CircuitBreaker.getState = async (name) => {
  if (!client || !getConnectionStatus()) return STATES.CLOSED;

  const state = await client.get(getStateKey(name));
  return state || STATES.CLOSED;
};

CircuitBreaker.recordSuccess = async (name) => {
  if (!client || !getConnectionStatus()) return;

  const multi = client.multi();
  multi.del(getFailureKey(name));
  multi.set(getStateKey(name), STATES.CLOSED);
  multi.del(getHalfOpenKey(name));
  await multi.exec();
};

CircuitBreaker.recordFailure = async (name, options = {}) => {
  if (!client || !getConnectionStatus()) return;

  const opts = { ...defaultOptions(name), ...options };
  const failureKey = getFailureKey(name);

  const count = await client.incr(failureKey);
  await client.expire(failureKey, opts.windowMs / 1000);

  if (count >= opts.failureThreshold) {
    const multi = client.multi();
    multi.set(getStateKey(name), STATES.OPEN);
    multi.expire(getStateKey(name), opts.recoveryTimeout / 1000);
    multi.set(getHalfOpenKey(name), "0");
    multi.expire(getHalfOpenKey(name), opts.recoveryTimeout / 1000);
    await multi.exec();
  }
};

CircuitBreaker.allowRequest = async (name, options = {}) => {
  if (!client || !getConnectionStatus()) return true;

  const opts = { ...defaultOptions(name), ...options };
  const state = await client.get(getStateKey(name));

  if (!state || state === STATES.CLOSED) return true;

    if (state === STATES.OPEN) {
      const ttl = await client.ttl(getStateKey(name));
      if (ttl === -2 || ttl <= 0) {
        const multi = client.multi();
        multi.set(getStateKey(name), STATES.HALF_OPEN);
        multi.set(getHalfOpenKey(name), "0");
        multi.expire(getHalfOpenKey(name), 60);
        await multi.exec();
        return true;
      }
      return false;
    }

  if (state === STATES.HALF_OPEN) {
    const halfOpenCount = parseInt(await client.get(getHalfOpenKey(name)) || "0", 10);
    if (halfOpenCount < opts.halfOpenMaxRequests) {
      await client.incr(getHalfOpenKey(name));
      return true;
    }
    return false;
  }

  return true;
};

CircuitBreaker.execute = async (name, fn, options = {}) => {
  const allowed = await CircuitBreaker.allowRequest(name, options);
  if (!allowed) {
    const err = new Error(`Circuit breaker open for ${name}`);
    err.code = "CIRCUIT_BREAKER_OPEN";
    err.service = name;
    throw err;
  }

  try {
    const result = await fn();
    await CircuitBreaker.recordSuccess(name);
    return result;
  } catch (err) {
    await CircuitBreaker.recordFailure(name, options);
    throw err;
  }
};

CircuitBreaker.reset = async (name) => {
  if (!client || !getConnectionStatus()) return;
  await client.del(getStateKey(name));
  await client.del(getFailureKey(name));
  await client.del(getHalfOpenKey(name));
};

CircuitBreaker.getStats = async (name) => {
  if (!client || !getConnectionStatus()) {
    return { state: STATES.CLOSED, failureCount: 0 };
  }

  const state = await client.get(getStateKey(name)) || STATES.CLOSED;
  const failureCount = parseInt(await client.get(getFailureKey(name)) || "0", 10);

  return { state, failureCount };
};

module.exports = CircuitBreaker;
