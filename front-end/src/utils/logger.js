const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== "production";

const logger = {
  log: (...args) => {
    if (isDev) console.log("[Vibe]", ...args);
  },
  error: (...args) => {
    if (isDev) console.error("[Vibe]", ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn("[Vibe]", ...args);
  },
  info: (...args) => {
    if (isDev) console.info("[Vibe]", ...args);
  },
  debug: (...args) => {
    if (isDev) console.debug("[Vibe]", ...args);
  },
};

export default logger;
