const { ModuleRegistry } = require("../tenant-platform/modules/module.registry");

jest.mock("fs", () => {
  const store = {};
  return {
    existsSync: jest.fn((path) => path in store || false),
    readFileSync: jest.fn((path) => store[path] || ""),
    writeFileSync: jest.fn((path, data) => {
      store[path] = data;
    }),
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
        manifestPath: "/fake/path/test.module.js",
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
      manifestPath: "/fake/path/test.module.js",
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
      manifestPath: "/fake/path/test.module.js",
      routes: [],
    });

    registry.checksums = { "test-module": "original-checksum" };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((path) => {
      if (path === "/fake/path/test.module.js") return "modified content";
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
      manifestPath: "/fake/path/test.module.js",
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
});
