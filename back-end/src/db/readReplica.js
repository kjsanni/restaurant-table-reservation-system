const db = require("./models");
const logger = require("../utils/logger");

/**
 * Read replica routing helpers.
 *
 * Strategy
 * --------
 * The application uses Sequelize's native read/write splitting (configured in
 * src/db/models/index.js). When a replica is configured, every SELECT is already
 * routed to the read pool automatically, so DAOs need no changes for the common
 * case.
 *
 * These helpers exist for the read-heavy reporting/analytics queries that we want
 * to be *explicit* about:
 *   - getRevenueStats / getPaymentStats   (payment.dao.js)
 *   - getReservationStats                  (reservation.dao.js)
 *   - getHeatmapV2                         (reservation.dao.js)
 *   - findAllReservations (filters)        (reservation.dao.js)
 *   - searchReservations                   (reservation.dao.js)
 *
 * They add two things on top of native splitting:
 *   1. `readOptions()` — force the read pool for a given query (useMaster:false).
 *   2. `withReplicaFallback()` — if the replica read fails at the connection
 *      level (replica down/unreachable), transparently retry against the primary
 *      (useMaster:true) so reporting endpoints degrade gracefully instead of
 *      erroring out.
 *
 * When no replica is configured, both helpers are no-ops that run against the
 * single primary database, preserving existing behaviour exactly.
 */

const isReplicaConfigured = () => db.replicaConfigured === true;

// Connection/availability errors for which falling back to the primary is safe.
// Query-level errors (bad SQL, constraint violations, etc.) are NOT retried.
const FALLBACK_ERROR_NAMES = new Set([
  "SequelizeConnectionError",
  "SequelizeConnectionRefusedError",
  "SequelizeHostNotFoundError",
  "SequelizeHostNotReachableError",
  "SequelizeConnectionTimedOutError",
  "SequelizeConnectionAcquireTimeoutError",
  "SequelizeAccessDeniedError",
]);

const FALLBACK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ECONNRESET",
  "PROTOCOL_CONNECTION_LOST",
]);

const isReplicaAvailabilityError = (err) => {
  if (!err) return false;
  if (FALLBACK_ERROR_NAMES.has(err.name)) return true;
  const code = err.code || err.original?.code || err.parent?.code;
  if (code && FALLBACK_ERROR_CODES.has(code)) return true;
  return false;
};

/**
 * Merge options that force a Sequelize query onto the read replica pool.
 * No-op (returns the options unchanged) when no replica is configured.
 *
 * Usage:
 *   Model.findAll(readReplica.readOptions({ where, attributes }))
 */
const readOptions = (options = {}) => {
  if (!isReplicaConfigured()) return options;
  return { ...options, useMaster: false };
};

/**
 * Merge options that force a query onto the primary (write) pool.
 */
const primaryOptions = (options = {}) => {
  return { ...options, useMaster: true };
};

/**
 * Run a read operation against the replica with automatic fallback to primary.
 *
 * @param {(opts: {useMaster: boolean|null}) => Promise<any>} run
 *        Callback that performs the read. It receives an options object whose
 *        `useMaster` should be spread into the Sequelize query options.
 * @param {object} [meta] Optional { label } for logging.
 */
const withReplicaFallback = async (run, meta = {}) => {
  if (!isReplicaConfigured()) {
    // Single DB: run normally, no explicit routing.
    return run({ useMaster: null });
  }

  try {
    return await run({ useMaster: false });
  } catch (err) {
    if (isReplicaAvailabilityError(err)) {
      logger.warn(
        `[db] Read replica unavailable for ${meta.label || "query"} (${err.name || err.code || "unknown"}). Falling back to primary.`
      );
      return run({ useMaster: true });
    }
    throw err;
  }
};

module.exports = {
  isReplicaConfigured,
  isReplicaAvailabilityError,
  readOptions,
  primaryOptions,
  withReplicaFallback,
};
