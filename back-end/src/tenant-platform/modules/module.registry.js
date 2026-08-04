"use strict";

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CHECKSUM_FILE = path.join(__dirname, "..", "..", "..", "..", "module-checksums.json");

const computeFileChecksum = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch (err) {
    return null;
  }
};

const loadStoredChecksums = () => {
  try {
    if (fs.existsSync(CHECKSUM_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKSUM_FILE, "utf8"));
    }
  } catch {
    return {};
  }
  return {};
};

const saveChecksums = (checksums) => {
  try {
    fs.writeFileSync(CHECKSUM_FILE, JSON.stringify(checksums, null, 2));
  } catch {
    // ignore write errors in read-only environments
  }
};

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.checksums = loadStoredChecksums();
  }

  register(module) {
    if (!module.id || typeof module.id !== "string") {
      throw new Error("Module id is required");
    }
    if (!module.routes || !Array.isArray(module.routes)) {
      throw new Error(`Module ${module.id} must define a routes array`);
    }
    this.modules.set(module.id, module);
  }

  verifyIntegrity() {
    const violations = [];
    const updated = { ...this.checksums };

    for (const [id, module] of this.modules) {
      const manifestPath = module.manifestPath || null;
      if (!manifestPath) continue;

      const currentChecksum = computeFileChecksum(manifestPath);
      if (!currentChecksum) {
        violations.push({ moduleId: id, reason: "manifest_unreadable", path: manifestPath });
        continue;
      }

      const stored = this.checksums[id];
      if (stored && stored !== currentChecksum) {
        violations.push({ moduleId: id, reason: "checksum_mismatch", path: manifestPath, stored, current: currentChecksum });
      }

      updated[id] = currentChecksum;
    }

    if (violations.length === 0) {
      saveChecksums(updated);
      this.checksums = updated;
    }

    return violations;
  }

  getEnabled() {
    const enabled = [];
    for (const [id, module] of this.modules) {
      try {
        if (module.enabled && module.enabled() === false) {
          continue;
        }
      } catch (err) {
        continue;
      }
      enabled.push(module);
    }
    return enabled;
  }

  load(app) {
    const enabled = this.getEnabled();
    for (const module of enabled) {
      for (const route of module.routes) {
        const middlewares = Array.isArray(route.middleware) ? route.middleware : [];
        app.use(route.path, ...middlewares, route.router);
      }
    }
  }
}

module.exports = { ModuleRegistry };
