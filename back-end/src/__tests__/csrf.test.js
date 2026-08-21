const { CSRF_COOKIE_NAME, generateCsrfToken, setCsrfCookie, validateCsrfToken } = require("../middleware/csrf");

describe("CSRF_COOKIE_NAME constant", () => {
  it("exports a defined cookie name", () => {
    expect(CSRF_COOKIE_NAME).toBe("XSRF-TOKEN");
    expect(typeof CSRF_COOKIE_NAME).toBe("string");
    expect(CSRF_COOKIE_NAME.length).toBeGreaterThan(0);
  });

  it("generates a non-empty token", () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("setCsrfCookie sets the expected cookie name when no cookie exists", () => {
    const req = { cookies: {} };
    const res = {
      cookie: jest.fn(),
    };
    const next = jest.fn();
    setCsrfCookie(req, res, next);
    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        secure: false,
        sameSite: false,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      })
    );
    expect(next).toHaveBeenCalled();
  });

  it("setCsrfCookie does not set cookie when one already exists", () => {
    const req = { cookies: { "XSRF-TOKEN": "existing-token" } };
    const res = {
      cookie: jest.fn(),
    };
    const next = jest.fn();
    setCsrfCookie(req, res, next);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("validateCsrfToken bypasses in test mode", async () => {
    const req = { method: "POST", cookies: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await validateCsrfToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("validateCsrfToken bypasses GET requests", async () => {
    const req = { method: "GET", cookies: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await validateCsrfToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("validateCsrfToken rejects when cookie or header is missing", async () => {
    const req = { method: "POST", cookies: {}, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await validateCsrfToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid CSRF token." });
    expect(next).not.toHaveBeenCalled();
  });

  it("validateCsrfToken accepts matching cookie and header tokens", async () => {
    const token = "abc123";
    const req = { method: "POST", cookies: { "XSRF-TOKEN": token }, headers: { "x-xsrf-token": token } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await validateCsrfToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("validateCsrfToken rejects mismatched cookie and header tokens", async () => {
    const req = { method: "POST", cookies: { "XSRF-TOKEN": "abc" }, headers: { "x-xsrf-token": "xyz" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await validateCsrfToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("csrf-token route in server.js", () => {
  it("CSRF_COOKIE_NAME is imported and used in the endpoint", () => {
    const serverSource = require("fs").readFileSync(require("path").join(__dirname, "../utils/server.js"), "utf8");
    expect(serverSource).toContain("CSRF_COOKIE_NAME");
    expect(serverSource).toContain('/api/v1/csrf-token');
    expect(serverSource).toContain('res.json({ success: true, token })');
  });
});
