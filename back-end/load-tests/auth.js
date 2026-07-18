"use strict";

/**
 * Auth helper for the load-test harness.
 *
 * Logs in a tenant admin against the running server and returns the cookies +
 * CSRF token needed to drive authenticated + write (CSRF-protected) requests.
 *
 * Uses Node's built-in fetch (Node 18+).
 */

const cfg = require("./config");
const fs = require("fs");
const path = require("path");

const SESSION_CACHE = path.join(__dirname, ".sessions.cache.json");
// JWT lives 30min; refresh cached sessions a little before that.
const SESSION_TTL_MS = 25 * 60 * 1000;

function loadCache() {
  try {
    if (!fs.existsSync(SESSION_CACHE)) return {};
    return JSON.parse(fs.readFileSync(SESSION_CACHE, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    fs.writeFileSync(SESSION_CACHE, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

/** Parse Set-Cookie headers into a "name=value; name2=value2" cookie string. */
function collectCookies(res) {
  const jar = {};
  // Node's fetch exposes getSetCookie() (undici) for multiple cookies.
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  for (const line of raw) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > -1) {
      jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
  return jar;
}

/**
 * Authenticate one tenant admin.
 * @returns {{ cookieHeader: string, csrfToken: string, tenantHeader: object }}
 */
async function loginTenant({ tenantId, adminEmail, password, useTenantHeader = true, noCache = false }) {
  const tenantHeaders = useTenantHeader ? { "X-Tenant-Id": String(tenantId) } : {};
  const cacheKey = `${tenantId}:${useTenantHeader ? "h" : "u"}`;

  // Reuse a cached, still-valid session to avoid the authLimiter (10/15min/IP).
  if (!noCache) {
    const cache = loadCache();
    const hit = cache[cacheKey];
    if (hit && Date.now() - hit.at < SESSION_TTL_MS) {
      return {
        tenantId,
        cookieHeader: hit.cookieHeader,
        csrfToken: hit.csrfToken,
        tenantHeaders,
      };
    }
  }

  // 1. Prime CSRF cookie
  const csrfRes = await fetch(`${cfg.API}/csrf-token`, {
    headers: { ...tenantHeaders },
  });
  const csrfJar = collectCookies(csrfRes);

  // 2. Login (sets token + refreshToken cookies)
  const loginRes = await fetch(`${cfg.API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...tenantHeaders,
      Cookie: Object.entries(csrfJar)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
    body: JSON.stringify({ email: adminEmail, password }),
  });

  if (loginRes.status !== 200) {
    const text = await loginRes.text();
    throw new Error(
      `Login failed for tenant ${tenantId} (${adminEmail}): ${loginRes.status} ${text}`
    );
  }

  const loginJar = collectCookies(loginRes);
  const jar = { ...csrfJar, ...loginJar };

  const csrfToken = jar["XSRF-TOKEN"];
  const cookieHeader = Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  if (!noCache) {
    const cache = loadCache();
    cache[cacheKey] = { cookieHeader, csrfToken, at: Date.now() };
    saveCache(cache);
  }

  return {
    tenantId,
    cookieHeader,
    csrfToken,
    tenantHeaders,
  };
}

module.exports = { loginTenant, collectCookies };
