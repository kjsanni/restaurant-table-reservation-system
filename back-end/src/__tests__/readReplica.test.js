// Read replica routing helper tests.
//
// These tests exercise src/db/readReplica.js in isolation by mocking the models
// module so no real database connection is required.

jest.mock("../db/models", () => ({
  // Toggled per-test to simulate replica-configured vs single-DB deployments.
  replicaConfigured: false,
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const db = require("../db/models");
const readReplica = require("../db/readReplica");

const makeErr = (name, code) => {
  const e = new Error(name || code || "err");
  if (name) e.name = name;
  if (code) e.code = code;
  return e;
};

describe("readReplica helper", () => {
  beforeEach(() => {
    db.replicaConfigured = false;
    jest.clearAllMocks();
  });

  describe("single database (no replica configured)", () => {
    it("readOptions is a no-op", () => {
      expect(readReplica.readOptions({ where: { id: 1 } })).toEqual({ where: { id: 1 } });
    });

    it("isReplicaConfigured returns false", () => {
      expect(readReplica.isReplicaConfigured()).toBe(false);
    });

    it("withReplicaFallback passes useMaster:null and runs once", async () => {
      const run = jest.fn(async ({ useMaster }) => useMaster);
      const result = await readReplica.withReplicaFallback(run);
      expect(result).toBeNull();
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe("replica configured", () => {
    beforeEach(() => {
      db.replicaConfigured = true;
    });

    it("readOptions forces the read pool (useMaster:false)", () => {
      expect(readReplica.readOptions({ where: { id: 1 } })).toEqual({
        where: { id: 1 },
        useMaster: false,
      });
    });

    it("primaryOptions forces the write pool (useMaster:true)", () => {
      expect(readReplica.primaryOptions({ where: { id: 1 } })).toEqual({
        where: { id: 1 },
        useMaster: true,
      });
    });

    it("withReplicaFallback reads from the replica when healthy", async () => {
      const run = jest.fn(async ({ useMaster }) => useMaster);
      const result = await readReplica.withReplicaFallback(run);
      expect(result).toBe(false); // read pool
      expect(run).toHaveBeenCalledTimes(1);
    });

    it("falls back to primary when the replica connection fails", async () => {
      const calls = [];
      const run = jest.fn(async ({ useMaster }) => {
        calls.push(useMaster);
        if (useMaster === false) throw makeErr("SequelizeConnectionRefusedError");
        return "primary";
      });
      const result = await readReplica.withReplicaFallback(run, { label: "test" });
      expect(result).toBe("primary");
      expect(calls).toEqual([false, true]);
    });

    it("falls back on wrapped driver error codes (ECONNREFUSED)", async () => {
      const run = jest.fn(async ({ useMaster }) => {
        if (useMaster === false) {
          const e = makeErr("SequelizeConnectionError");
          e.original = makeErr(null, "ECONNREFUSED");
          throw e;
        }
        return "primary";
      });
      const result = await readReplica.withReplicaFallback(run);
      expect(result).toBe("primary");
      expect(run).toHaveBeenCalledTimes(2);
    });

    it("does NOT fall back on query-level errors (rethrows)", async () => {
      const run = jest.fn(async () => {
        throw makeErr("SequelizeDatabaseError");
      });
      await expect(readReplica.withReplicaFallback(run)).rejects.toThrow();
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe("isReplicaAvailabilityError", () => {
    it("classifies connection errors as retryable", () => {
      expect(readReplica.isReplicaAvailabilityError(makeErr("SequelizeConnectionError"))).toBe(true);
      expect(readReplica.isReplicaAvailabilityError(makeErr(null, "ETIMEDOUT"))).toBe(true);
    });

    it("classifies query errors as non-retryable", () => {
      expect(readReplica.isReplicaAvailabilityError(makeErr("SequelizeDatabaseError"))).toBe(false);
      expect(readReplica.isReplicaAvailabilityError(null)).toBe(false);
    });
  });
});
