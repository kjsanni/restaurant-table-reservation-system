const withRetry = async (fn, retries = 3, delayMs = 1000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const isTransient =
        err?.response?.status === 429 ||
        err?.response?.status === 500 ||
        err?.response?.status === 502 ||
        err?.response?.status === 503 ||
        err?.message?.includes("timeout") ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "ECONNRESET";

      if (!isTransient || attempt >= retries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
};

module.exports = {
  withRetry,
};
