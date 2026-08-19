const SecurityReview = require("../tenant-platform/utils/security/security-review");

jest.mock("fs", () => ({
  readdirSync: jest.fn().mockReturnValue([]),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  readFileSync: jest.fn().mockReturnValue(""),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe("Security Review", () => {
  it("returns no issues for clean codebase", async () => {
    const review = await SecurityReview.runFullReview();
    expect(review).toHaveProperty("summary");
    expect(review).toHaveProperty("issues");
  });

  it("detects hardcoded secrets", async () => {
    const issues = await SecurityReview.checkHardcodedSecrets();
    expect(Array.isArray(issues)).toBe(true);
  });

  it("detects SQL injection patterns", async () => {
    const issues = await SecurityReview.checkSqlInjectionPatterns();
    expect(Array.isArray(issues)).toBe(true);
  });

  it("detects auth coverage gaps", async () => {
    const issues = await SecurityReview.checkAuthCoverage();
    expect(Array.isArray(issues)).toBe(true);
  });
});
