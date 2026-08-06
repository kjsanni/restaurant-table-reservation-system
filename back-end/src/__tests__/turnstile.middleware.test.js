const validateTurnstile = require("../middleware/turnstile");

jest.mock("../DAOs/auth.dao");

const authDAO = require("../DAOs/auth.dao");

describe("turnstile middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes when turnstile is disabled", async () => {
    authDAO.getPlatformSettingByKey.mockResolvedValue({ value: false });

    const req = { body: {}, headers: {}, ip: "1.2.3.4" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await validateTurnstile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects when token is missing", async () => {
    authDAO.getPlatformSettingByKey.mockResolvedValue({ value: true });

    const req = { body: {}, headers: {}, ip: "1.2.3.4" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await validateTurnstile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Turnstile verification failed. Please try again.",
    });
  });

  it("catches internal verification failure without crashing", async () => {
    authDAO.getPlatformSettingByKey.mockRejectedValue(new Error("DB down"));

    const req = { body: { cfTurnstileToken: "token" }, headers: {}, ip: "1.2.3.4" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await validateTurnstile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Turnstile verification failed. Please try again.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
