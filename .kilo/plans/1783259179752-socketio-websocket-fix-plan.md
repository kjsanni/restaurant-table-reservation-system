# Socket.io WebSocket Connection Fix — Completed

## Root Causes (discovered in order)

### 1. Apache Proxy Misconfiguration (primary blocker)
The active production config (`/etc/apache2/sites-available/nguni.conf`) had:
- `ProxyPass /socket.io/ ws://127.0.0.1:8000/socket.io/$1` — `$1` is **literal**, not a regex capture, so every `/socket.io/` request was sent to `/socket.io/$1` on the backend, which Socket.io didn't recognize → **400 Bad Request**
- A `mod_rewrite` block underneath that never executed because `ProxyPass` has higher precedence
- A catch-all `ProxyPass / http://127.0.0.1:8080/` that intercepted requests when the `$1` proxy failed

### 2. PM2 Cluster Mode (the "Session ID unknown" error)
Even after fixing the proxy, all POST/GET requests to an existing `sid` returned `{"code":1,"message":"Session ID unknown"}` because the backend ran in **cluster mode with 4 workers (`-i max`)**. Each worker has its own in-memory Engine.IO session store, so a request landing on a different worker than the one that created the session was rejected.

### 3. Dotenv Override Order
`back-end/config/config.js:2-3` loaded `.env` first (with `CORS_ORIGINS=` empty), then `.env.production` with `override: false`, meaning the empty value persisted. Fixed by changing to `override: true`.

### 4. CORS Origin Placeholder
`back-end/.env.production` had placeholder domains `https://restaurant.example.com` instead of the actual IP. Also had a typo `hhtp://` (fixed).

## Changes Applied

### Server (live production)
**`/etc/apache2/sites-available/nguni.conf`**
```diff
-   ProxyPass /socket.io/ ws://127.0.0.1:8000/socket.io/$1
-   ProxyPassReverse /socket.io/ ws://127.0.0.1:8000/socket.io/
-   <IfModule mod_rewrite.c>
-       RewriteEngine On
-       RewriteCond %{REQUEST_URI} ^/socket.io [NC]
-       RewriteRule /(.*) ws://127.0.0.1:8000/$1 [P,L]
-   </IfModule>
+   ProxyPassMatch "^/socket.io/(.*)" ws://127.0.0.1:8000/socket.io/$1
+   ProxyPassReverse /socket.io/ ws://127.0.0.1:8000/socket.io/
```

**PM2 process restarted in single-instance mode:**
```bash
pm2 start /var/www/html/nguni/back-end/src/app.js --name nguni-backend -i 1 --env production
```

**`back-end/.env.production`**
```diff
- CORS_ORIGINS=https://restaurant.example.com,https://admin.example.com
+ CORS_ORIGINS=http://192.168.88.10,http://192.168.88.10:8080,http://192.168.88.10:8000
# Also fixed: hhtp:// → http://
```

### Local repo (synced)
**`back-end/config/config.js`** — changed `override: false` → `override: true` for `.env.production`

**`back-end/.env.production`** — updated CORS_ORIGINS to actual IP

**`ecosystem.config.js`** — changed `instances: 'max'` → `instances: 1`

**`deploy-prod.sh`** — changed `-i max` → `-i 1`

**`apache-production.conf`** — replaced broken rewrite-based proxy with `ProxyPassMatch`

## Verification
- `curl http://192.168.88.10/socket.io/?EIO=4&transport=polling` → **HTTP 200**, body: `0{"sid":"...","upgrades":["websocket"],...}`
- Curl WebSocket upgrade test → **HTTP 101 Switching Protocols**
- Backend logs: `Client connected: J-EjU10zkHJUonsNAAAB` — Socket.io handshake completes successfully

## Note
If more than 1 CPU core is desired for throughput, the proper solution is to use `@socket.io/sticky` session adapter or Redis adapter. For current traffic, single instance is sufficient.
