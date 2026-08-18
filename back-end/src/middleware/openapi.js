"use strict";

const swaggerUi = require("swagger-ui-express");

const collectRoutes = (router, paths, tags, basePath = "") => {
  if (!router || !router.stack) return;
  router.stack.forEach((layer) => {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).filter((m) => route.methods[m]).map((m) => m.toLowerCase());
      if (!methods.length) return;
      const fullPath = `${basePath}${route.path}`.replace(/\/+/g, "/");
      const pathItem = paths[fullPath] || {};
      methods.forEach((method) => {
        const operation = buildOperation(basePath, method);
        tags.add(`${basePath.split("/")[2] || "root"}`);
        if (!pathItem[method]) pathItem[method] = operation;
      });
      paths[fullPath] = pathItem;
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      const nestedBase = `${basePath}${layer.regexp ? layer.regexp.toString().replace(/\\\//g, "/").replace(/[\\^$.*+?()[\]{}|]/g, "").replace(/\?/g, "") : ""}`;
      collectRoutes(layer.handle, paths, tags, nestedBase);
    }
  });
};

const buildOperation = (basePath, method) => ({
  tags: [`${basePath.split("/")[2] || "root"}`],
  responses: {
    "200": { description: "Success" },
    "400": { description: "Bad Request" },
    "401": { description: "Unauthorized" },
    "403": { description: "Forbidden" },
    "404": { description: "Not Found" },
    "500": { description: "Server Error" },
  },
});

const collectAppRoutes = (app, paths, tags) => {
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).filter((m) => route.methods[m]).map((m) => m.toLowerCase());
      if (!methods.length) return;
      const fullPath = route.path.replace(/\/+/g, "/");
      const pathItem = paths[fullPath] || {};
      methods.forEach((method) => {
        const operation = buildRootOperation();
        tags.add("root");
        if (!pathItem[method]) pathItem[method] = operation;
      });
      paths[fullPath] = pathItem;
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      const routerBase = layer.regexp ? layer.regexp.toString().replace(/\\\//g, "/").replace(/[\\^$.*+?()[\]{}|]/g, "").replace(/\?/g, "") : "";
      collectRoutes(layer.handle, paths, tags, routerBase);
    }
  });
};

const buildRootOperation = () => ({
  tags: ["root"],
  responses: {
    "200": { description: "Success" },
    "400": { description: "Bad Request" },
    "401": { description: "Unauthorized" },
    "403": { description: "Forbidden" },
    "404": { description: "Not Found" },
    "500": { description: "Server Error" },
  },
});

const buildSpec = (app) => {
  const paths = {};
  const tags = new Set();

  collectAppRoutes(app, paths, tags);

  return {
    openapi: "3.0.3",
    info: {
      title: "RTRS API",
      version: "1.0.0",
      description: "Restaurant Table Reservation System API",
    },
    servers: [{ url: "/api/v1" }],
    tags: Array.from(tags).map((t) => ({ name: t })),
    paths,
  };
};

let cachedSpec = null;
let cachedApp = null;

const getOrBuildSpec = (app) => {
  if (cachedApp === app && cachedSpec) return cachedSpec;
  cachedSpec = buildSpec(app);
  cachedApp = app;
  return cachedSpec;
};

const specGenerator = {
  generate: (app) => getOrBuildSpec(app),
  getSpec: (app) => getOrBuildSpec(app),
  swaggerUi: swaggerUi.serve,
  swaggerSetup: (req, res) => swaggerUi.setup(null, { spec: getOrBuildSpec(req.app) })(req, res),
};

module.exports = specGenerator;
