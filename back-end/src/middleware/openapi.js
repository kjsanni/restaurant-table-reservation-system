"use strict";

const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");

const SPEC_PATH = path.join(__dirname, "..", "openapi.json");

const buildSpec = (app) => {
  const paths = {};
  const tags = new Set();

  const collectRoutes = (router, basePath = "") => {
    if (!router || !router.stack) return;
    router.stack.forEach((layer) => {
      if (layer.route) {
        const route = layer.route;
        const method = Object.keys(route.methods).find((m) => route.methods[m])?.toLowerCase();
        if (!method) return;
        const fullPath = `${basePath}${route.path}`.replace(/\/+/g, "/");
        const pathItem = paths[fullPath] || {};
        const operation = {
          tags: [`${basePath.split("/")[2] || "root"}`],
          responses: {
            "200": { description: "Success" },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Not Found" },
            "500": { description: "Server Error" },
          },
        };
        tags.add(`${basePath.split("/")[2] || "root"}`);
        if (!pathItem[method]) pathItem[method] = operation;
        paths[fullPath] = pathItem;
      } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
        const nestedBase = `${basePath}${layer.regexp ? layer.regexp.toString().replace(/\\\//g, "/").replace(/[\\^$.*+?()[\]{}|]/g, "").replace(/\?/g, "") : ""}`;
        collectRoutes(layer.handle, nestedBase);
      }
    });
  };

  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const route = layer.route;
      const method = Object.keys(route.methods).find((m) => route.methods[m])?.toLowerCase();
      if (!method) return;
      const fullPath = route.path.replace(/\/+/g, "/");
      const pathItem = paths[fullPath] || {};
      const operation = {
        tags: ["root"],
        responses: {
          "200": { description: "Success" },
          "400": { description: "Bad Request" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not Found" },
          "500": { description: "Server Error" },
        },
      };
      tags.add("root");
      if (!pathItem[method]) pathItem[method] = operation;
      paths[fullPath] = pathItem;
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      const routerBase = layer.regexp ? layer.regexp.toString().replace(/\\\//g, "/").replace(/[\\^$.*+?()[\]{}|]/g, "").replace(/\?/g, "") : "";
      collectRoutes(layer.handle, routerBase);
    }
  });

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

const writeSpec = (app) => {
  const spec = buildSpec(app);
  fs.writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2));
  return spec;
};

const readSpec = () => {
  if (!fs.existsSync(SPEC_PATH)) return null;
  return JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
};

const specGenerator = {
  generate: writeSpec,
  getSpec: readSpec,
  swaggerUi: swaggerUi.serve,
  swaggerSetup: swaggerUi.setup(null, { spec: SPEC_PATH }),
};

module.exports = specGenerator;
