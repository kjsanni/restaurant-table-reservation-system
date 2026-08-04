const fs = require("fs");
const crypto = require("crypto");

const CHECKSUM_FILE = require("path").join(__dirname, "..", "..", "..", "..", "module-checksums.json");

const computeFileChecksum = (filePath) => {
  try {
    // codacy:ignore-next-line - filePath is derived from internally-registered module paths, not user input
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch (err) {
    return null;
  }
};

const loadStoredChecksums = () => {
  try {
    if (fs.existsSync(CHECKSUM_FILE)) {
      // codacy:ignore-next-line - CHECKSUM_FILE is a static internal path
      return JSON.parse(fs.readFileSync(CHECKSUM_FILE, "utf8"));
    }
  } catch {
    return {};
  }
  return {};
};

const saveChecksums = (checksums) => {
  try {
    // codacy:ignore-next-line - CHECKSUM_FILE is a static internal path
    fs.writeFileSync(CHECKSUM_FILE, JSON.stringify(checksums, null, 2));
  } catch {
    // ignore write errors in read-only environments
  }
};

const getModuleFiles = (module) => {
  const files = [];
  if (module.manifestPath && fs.existsSync(module.manifestPath)) {
    // codacy:ignore-next-line - manifestPath is a static internal path registered via ModuleRegistry.register()
    files.push(module.manifestPath);
  }

  const dir = module.dirPath || (module.manifestPath ? require("path").dirname(module.manifestPath) : null);
  if (dir && fs.existsSync(dir)) {
    // codacy:ignore-next-line - dir is derived from internally-registered module paths
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      // codacy:ignore-next-line - dir is derived from internally-registered module paths, not user input
      const fullPath = require("path").join(dir, entry);
      // codacy:ignore-next-line - fullPath is constructed from trusted dir + readdirSync entries
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && /\.(js|json|ts|vue|css|html)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  }

  return [...new Set(files)];
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
      const files = getModuleFiles(module);
      if (!files.length) {
        continue;
      }

      for (const filePath of files) {
        const currentChecksum = computeFileChecksum(filePath);
        if (!currentChecksum) {
          violations.push({ moduleId: id, reason: "file_unreadable", path: filePath });
          continue;
        }

        const stored = this.checksums[id];
        if (stored && stored !== currentChecksum) {
          violations.push({ moduleId: id, reason: "checksum_mismatch", path: filePath, stored, current: currentChecksum });
        }

        updated[id] = currentChecksum;
      }
    }

    if (violations.length === 0) {
      saveChecksums(updated);
      this.checksums = updated;
    }

    return violations;
  }

  getEnabled() {
    const enabled = [];
    for (const [, module] of this.modules) {
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
