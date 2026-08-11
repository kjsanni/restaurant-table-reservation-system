const fs = require("fs");
const path = require("path");

const ROUTES_DIR = path.join(__dirname, "..", "src");
const OUTPUT = path.join(__dirname, "postman_collection.json");

const routeDirectories = [
  path.join(ROUTES_DIR, "routes"),
  path.join(ROUTES_DIR, "tenant-platform", "routes"),
  path.join(ROUTES_DIR, "verticals", "salon", "routes"),
];

function readRouteFiles() {
  const files = [];
  for (const dir of routeDirectories) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      files.push(path.join(dir, file));
    }
  }
  return files;
}

function extractRoutes(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const routes = [];
  const lines = content.split("\n");

  let currentPath = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const routePathMatch = line.match(
      /\.route\(\s*["'](\/[^"']+)["']\s*\)/
    );
    if (routePathMatch) {
      currentPath = routePathMatch[1];
      continue;
    }

    const methodMatch = line.match(
      /\.(get|post|put|patch|delete|all)\s*\(\s*(?:tryCatchHandler|require\()/
    );
    if (methodMatch && currentPath) {
      const method = methodMatch[1].toUpperCase();
      routes.push({
        method: method === "ALL" ? "ANY" : method,
        path: currentPath,
        file: path.basename(filePath),
      });
    }
  }

  return routes;
}

const allRoutes = [];
for (const file of readRouteFiles()) {
  allRoutes.push(...extractRoutes(file));
}

const uniqueRoutes = [];
const seen = new Set();
for (const route of allRoutes) {
  const key = `${route.method}:${route.path}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRoutes.push(route);
  }
}

uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

function requestFor(route) {
  const fullPath = `/api/v1${route.path}`;
  const method = route.method === "ANY" ? "GET" : route.method;
  const req = {
    method,
    header: [
      { key: "Accept", value: "application/json" },
      { key: "Content-Type", value: "application/json" },
    ],
    url: {
      raw: `{{baseUrl}}${fullPath}`,
      host: ["{{baseUrl}}"],
      path: fullPath.split("/").filter(Boolean),
    },
  };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    req.body = {
      mode: "raw",
      raw: getSampleBody(fullPath),
      options: { raw: { language: "json" } },
    };
  }

  return req;
}

function getSampleBody(fullPath) {
  if (fullPath === "/api/v1/auth/login") {
    return JSON.stringify(
      { email: "admin@rtrs.com", password: "{{testPassword}}" },
      null,
      2
    );
  }
  if (fullPath === "/api/v1/auth/register") {
    return JSON.stringify(
      {
        name: "New Tenant",
        slug: "new-tenant",
        email: "tenant@example.com",
        password: "{{testPassword}}",
        businessVertical: "restaurant",
      },
      null,
      2
    );
  }
  if (fullPath === "/api/v1/auth/register/customer") {
    return JSON.stringify(
      {
        email: "customer@example.com",
        password: "{{testPassword}}",
        firstName: "John",
        lastName: "Doe",
        phone: "0241234567",
      },
      null,
      2
    );
  }
  if (fullPath === "/api/v1/reservations") {
    return JSON.stringify(
      {
        resDate: "2026-07-30",
        resTime: "19:00",
        people: 4,
        name: "John Doe",
        email: "john@example.com",
        phone: "0241234567",
      },
      null,
      2
    );
  }
  if (fullPath === "/api/v1/tables") {
    return JSON.stringify(
      { name: "Table 1", capacity: 4, section: "main" },
      null,
      2
    );
  }
  if (fullPath.includes("/payments") && method === "POST") {
    return JSON.stringify(
      { reservationId: "{{reservationId}}", amount: 150, method: "cash" },
      null,
      2
    );
  }
  if (fullPath.includes("/reviews")) {
    return JSON.stringify(
      { reservationId: "{{reservationId}}", rating: 5, comment: "Great service" },
      null,
      2
    );
  }
  if (fullPath.includes("/webhooks") && method === "POST") {
    return JSON.stringify(
      { url: "https://example.com/webhook", events: ["payment.success"] },
      null,
      2
    );
  }
  if (fullPath.includes("/waitlist")) {
    return JSON.stringify(
      { date: "2026-07-30", time: "19:00", people: 4, name: "Walk-in" },
      null,
      2
    );
  }
  if (fullPath.includes("/loyalty") || fullPath.includes("/referrals")) {
    return JSON.stringify({ customerId: "{{customerId}}" }, null, 2);
  }
  if (fullPath.includes("/marketing")) {
    return JSON.stringify(
      {
        name: "Summer Promo",
        type: "email",
        audience: "all_customers",
        content: "Check out our new menu!",
      },
      null,
      2
    );
  }
  return JSON.stringify({}, null, 2);
}

const setupFolder = {
  name: "Setup",
  item: [
    {
      name: "Get CSRF Token",
      request: {
        method: "GET",
        header: [],
        url: { raw: "{{baseUrl}}/api/v1/csrf-token", host: ["{{baseUrl}}"], path: ["api", "v1", "csrf-token"] },
      },
      event: [
        { listen: "test", script: { exec: ['pm.environment.set("csrfToken", pm.response.headers.get("x-csrf-token") || "");'] } },
      ],
    },
    {
      name: "Login",
      request: {
        method: "POST",
        header: [
          { key: "Accept", value: "application/json" },
          { key: "Content-Type", value: "application/json" },
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "admin@rtrs.com", password: "{{testPassword}}" }, null, 2),
          options: { raw: { language: "json" } },
        },
        url: { raw: "{{baseUrl}}/api/v1/auth/login", host: ["{{baseUrl}}"], path: ["api", "v1", "auth", "login"] },
      },
      event: [
        {
          listen: "test",
          script: {
            exec: [
              'const token = pm.response.json().token;',
              'if (token) { pm.environment.set("accessToken", token); }',
            ],
          },
        },
      ],
    },
  ],
};

const routesFolder = {
  name: "Routes",
  item: uniqueRoutes.map((route) => ({
    name: `${route.method} ${route.path}`,
    request: requestFor(route),
    description: `From ${route.file}`,
  })),
};

const collection = {
  info: {
    _postman_id: "rtrs-full-collection",
    name: "RTRS API — Full Route Coverage",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description:
      "Auto-generated Postman collection from route files with sample requests and auth setup.",
  },
  event: [
    {
      listen: "prerequest",
      script: {
        exec: [
          'const token = pm.environment.get("accessToken");',
          'if (token) { pm.request.headers.upsert({key: "Authorization", value: "Bearer " + token}); }',
        ],
      },
    },
  ],
  variable: [
    { key: "baseUrl", value: "http://localhost:8000" },
    { key: "apiPath", value: "/api/v1" },
    { key: "accessToken", value: "{{accessToken}}" },
    { key: "csrfToken", value: "" },
    { key: "reservationId", value: "1" },
    { key: "tableId", value: "1" },
    { key: "testPassword", value: "password123" },
  ],
  item: [setupFolder, routesFolder],
};

fs.writeFileSync(OUTPUT, JSON.stringify(collection, null, 2));
console.log(`Generated ${uniqueRoutes.length} routes in ${OUTPUT}`);
