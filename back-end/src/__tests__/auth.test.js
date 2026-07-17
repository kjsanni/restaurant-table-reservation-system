const authDAO = require("../DAOs/auth.dao");

jest.mock("../db/models");
const db = require("../db/models");

describe("Auth — login lockout sliding window", () => {
  beforeEach(() => jest.clearAllMocks());

  const makeAttempt = (minutesAgo) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutesAgo);
    return { email: "test@example.com", ipAddress: "1.2.3.4", attemptedAt: d };
  };

  it("does not lock out with fewer than 5 attempts in the last 15 minutes", async () => {
    db.loginAttempt.count.mockResolvedValue(3);

    const result = await authDAO.checkLoginLockout("test@example.com", "1.2.3.4", null);
    expect(result.locked).toBe(false);
  });

  it("locks out when 5 or more attempts occur in the last 15 minutes", async () => {
    db.loginAttempt.count.mockResolvedValue(5);
    db.loginAttempt.findOne.mockResolvedValue({ attemptedAt: new Date() });

    const result = await authDAO.checkLoginLockout("test@example.com", "1.2.3.4", null);
    expect(result.locked).toBe(true);
    expect(result.remainingSeconds).toBeGreaterThan(0);
  });

  it("does not lock out when 5 attempts are spread beyond 15 minutes", async () => {
    db.loginAttempt.count.mockResolvedValue(1);

    const result = await authDAO.checkLoginLockout("test@example.com", "1.2.3.4", null);
    expect(result.locked).toBe(false);
  });

  it("returns false when loginAttempt model is unavailable", async () => {
    const original = db.loginAttempt;
    db.loginAttempt = null;

    const result = await authDAO.checkLoginLockout("test@example.com", "1.2.3.4", null);
    expect(result.locked).toBe(false);
    expect(result.remainingSeconds).toBe(0);

    db.loginAttempt = original;
  });
});
