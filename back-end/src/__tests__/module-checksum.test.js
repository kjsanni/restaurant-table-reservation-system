const path = require("path");
const { ModuleRegistry } = require("../tenant-platform/modules/module.registry");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const SAFE_MANIFEST = path.join(PROJECT_ROOT, "src", "__tests__", "test.module.js");

const fsStore = {};

jest.mock("fs", () => {
  const store = fsStore;
  return {
    existsSync: jest.fn((p) => p in store || false),
    readFileSync: jest.fn((p) => store[p] || ""),
    writeFileSync: jest.fn((p, data) => {
      store[p] = data;
    }),
    readdirSync: jest.fn(() => []),
    statSync: jest.fn(() => ({ isFile: () => false })),
  };
});

const fs = require("fs");

describe("ModuleRegistry checksum verification", () => {
  let registry;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve("../tenant-platform/modules/module.registry")];
    jest.resetModules();
    registry = new ModuleRegistry();
  });

  it("registers modules without errors", () => {
    expect(() => {
      registry.register({
        id: "test-module",
        name: "Test Module",
        version: "1.0.0",
        enabled: () => true,
        manifestPath: SAFE_MANIFEST,
        routes: [],
      });
    }).not.toThrow();
  });

  it("returns empty violations on first run when no stored checksums exist", () => {
    fs.existsSync.mockReturnValue(false);

    registry.register({
      id: "test-module",
      name: "Test Module",
      version: "1.0.0",
      enabled: () => true,
      manifestPath: SAFE_MANIFEST,
      routes: [],
    });

    const violations = registry.verifyIntegrity();
    expect(violations).toEqual([]);
  });

  it("detects checksum mismatch when manifest changes", () => {
    registry.register({
      id: "test-module",
      name: "Test Module",
      version: "1.0.0",
      enabled: () => true,
      manifestPath: SAFE_MANIFEST,
      routes: [],
    });

    registry.checksums = { "test-module": "original-checksum" };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath === SAFE_MANIFEST) return "modified content";
      return "";
    });

    const violations = registry.verifyIntegrity();
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].moduleId).toBe("test-module");
    expect(violations[0].reason).toBe("checksum_mismatch");
  });

  it("saves checksums after successful verification", () => {
    fs.existsSync.mockReturnValue(false);
    fs.writeFileSync.mockClear();

    registry.register({
      id: "test-module",
      name: "Test Module",
      version: "1.0.0",
      enabled: () => true,
      manifestPath: SAFE_MANIFEST,
      routes: [],
    });

    registry.verifyIntegrity();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("skips modules without manifestPath", () => {
    registry.register({
      id: "no-manifest",
      name: "No Manifest",
      version: "1.0.0",
      enabled: () => true,
      routes: [],
    });

    const violations = registry.verifyIntegrity();
    expect(violations).toEqual([]);
  });

  it("skips modules with manifestPath outside project root", () => {
    const outsideManifest = "/etc/passwd";
    fsStore[outsideManifest] = "root:x:0:0:root:/root:/bin/bash";
    fs.existsSync.mockImplementation((p) => p === outsideManifest || p in fsStore);

    registry.register({
      id: "outside-module",
      name: "Outside Module",
      version: "1.0.0",
      enabled: () => true,
      manifestPath: outsideManifest,
      routes: [],
    });

    const violations = registry.verifyIntegrity();
    expect(violations).toEqual([]);
    expect(fs.readFileSync).not.toHaveBeenCalledWith(outsideManifest, expect.anything());
  });

  it("skips modules with dirPath outside project root", () => {
    const outsideDir = "/tmp";
    fsStore[outsideDir] = true;
    fs.existsSync.mockImplementation((p) => p === outsideDir || p in fsStore);
    fs.readdirSync.mockReturnValue([]);

    registry.register({
      id: "outside-dir-module",
      name: "Outside Dir Module",
      version: "1.0.0",
      enabled: () => true,
      dirPath: outsideDir,
      routes: [],
    });

    const violations = registry.verifyIntegrity();
    expect(violations).toEqual([]);
    expect(fs.readdirSync).not.toHaveBeenCalledWith(outsideDir);
  });

  it("blocks path traversal in dirPath", () => {
    const traversalDir = path.join(PROJECT_ROOT, "..", "..", "etc");
    fsStore[traversalDir] = true;
    fs.existsSync.mockImplementation((p) => p === traversalDir || p in fsStore);
    fs.readdirSync.mockReturnValue([]);

    registry.register({
      id: "traversal-module",
      name: "Traversal Module",
      version: "1.0.0",
      enabled: () => true,
      dirPath: traversalDir,
      routes: [],
    });

    const violations = registry.verifyIntegrity();
    expect(violations).toEqual([]);
    expect(fs.readdirSync).not.toHaveBeenCalledWith(traversalDir);
  });
});
