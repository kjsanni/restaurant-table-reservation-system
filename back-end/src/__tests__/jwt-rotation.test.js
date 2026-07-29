const {
  verifyTokenWithFallback,
  getCurrentSecret,
  getPreviousSecret,
} = require("../utils/jwtRotation");
const jwt = require("jsonwebtoken");

describe("jwtRotation", () => {
  let currentSecret;
  let previousSecret;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    currentSecret = "current-secret-key-here-1234567890123456789012345678";
    previousSecret = "previous-secret-key-here-1234567890123456789012";
    process.env.JWT_SECRET = currentSecret;
    process.env.JWT_SECRET_PREVIOUS = previousSecret;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
  });

  describe("getCurrentSecret", () => {
    it("returns JWT_SECRET when set and long enough", () => {
      expect(getCurrentSecret()).toBe(currentSecret);
    });

    it("throws when JWT_SECRET is missing", () => {
      delete process.env.JWT_SECRET;
      expect(() => getCurrentSecret()).toThrow("JWT_SECRET environment variable must be set");
    });

    it("throws when JWT_SECRET is too short", () => {
      process.env.JWT_SECRET = "short";
      expect(() => getCurrentSecret()).toThrow("JWT_SECRET must be at least 256 bits (32 characters)");
    });
  });

  describe("getPreviousSecret", () => {
    it("returns JWT_SECRET_PREVIOUS when set", () => {
      expect(getPreviousSecret()).toBe(previousSecret);
    });

    it("returns null when JWT_SECRET_PREVIOUS is missing", () => {
      delete process.env.JWT_SECRET_PREVIOUS;
      expect(getPreviousSecret()).toBeNull();
    });
  });

  describe("verifyTokenWithFallback", () => {
    it("verifies token signed with current secret", () => {
      const token = jwt.sign({ userId: 1, role: "staff" }, currentSecret, { expiresIn: "30m" });
      const decoded = verifyTokenWithFallback(token);
      expect(decoded.userId).toBe(1);
    });

    it("falls back to previous secret when current secret throws TokenExpiredError", () => {
      const token = jwt.sign({ userId: 1, role: "staff" }, previousSecret, { expiresIn: "-1s" });
      const decoded = verifyTokenWithFallback(token);
      expect(decoded.userId).toBe(1);
    });

    it("falls back to previous secret when current secret throws JsonWebTokenError", () => {
      const token = jwt.sign({ userId: 1, role: "staff" }, previousSecret, { expiresIn: "30m" });

      const { getCurrentSecret } = require("../utils/jwtRotation");
      const original = getCurrentSecret();
      const module = require("../utils/jwtRotation");
      module.getCurrentSecret = () => "definitely-wrong-secret-key";

      const decoded = verifyTokenWithFallback(token);
      expect(decoded.userId).toBe(1);
    });

    it("throws when token is invalid with both secrets", () => {
      expect(() => verifyTokenWithFallback("completely.invalid.token")).toThrow();
    });

    it("does not fallback when previous secret is missing", () => {
      delete process.env.JWT_SECRET_PREVIOUS;
      const token = jwt.sign({ userId: 1 }, previousSecret, { expiresIn: "30m" });

      expect(() => verifyTokenWithFallback(token)).toThrow();
    });
  });
});
