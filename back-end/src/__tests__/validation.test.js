const validation = require("../utils/validation");

describe("validation utilities", () => {
  describe("isValidEmail", () => {
    it("accepts valid emails", () => {
      expect(validation.isValidEmail("user@example.com")).toBe(true);
      expect(validation.isValidEmail("john.doe@domain.co")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(validation.isValidEmail("")).toBe(false);
      expect(validation.isValidEmail(null)).toBe(false);
      expect(validation.isValidEmail("invalid")).toBe(false);
      expect(validation.isValidEmail("missing@dot")).toBe(false);
      expect(validation.isValidEmail("@missing-user.com")).toBe(false);
    });
  });

  describe("normalizePhone", () => {
    it("strips non-digit characters except leading +", () => {
      expect(validation.normalizePhone("+233 24 123 4567")).toBe("233241234567");
      expect(validation.normalizePhone("024-123-4567")).toBe("0241234567");
    });

    it("returns empty string for null/undefined", () => {
      expect(validation.normalizePhone(null)).toBe("");
      expect(validation.normalizePhone("")).toBe("");
    });
  });

  describe("isValidPhone", () => {
    it("accepts valid Ghana phone formats", () => {
      expect(validation.isValidPhone("233241234567")).toBe(true);
      expect(validation.isValidPhone("0241234567")).toBe(true);
      expect(validation.isValidPhone("+233241234567")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(validation.isValidPhone("")).toBe(false);
      expect(validation.isValidPhone(null)).toBe(false);
      expect(validation.isValidPhone("123")).toBe(false);
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats 9-digit Ghana numbers with 233 prefix", () => {
      expect(validation.formatPhoneNumber("0241234567")).toBe("233241234567");
    });

    it("preserves 233-prefixed numbers", () => {
      expect(validation.formatPhoneNumber("233241234567")).toBe("233241234567");
    });

    it("returns null for invalid input", () => {
      expect(validation.formatPhoneNumber(null)).toBe(null);
      expect(validation.formatPhoneNumber("")).toBe(null);
    });
  });

  describe("isPositiveInteger", () => {
    it("accepts positive integers", () => {
      expect(validation.isPositiveInteger(1)).toBe(true);
      expect(validation.isPositiveInteger(100)).toBe(true);
    });

    it("rejects non-positive integers", () => {
      expect(validation.isPositiveInteger(0)).toBe(false);
      expect(validation.isPositiveInteger(-1)).toBe(false);
      expect(validation.isPositiveInteger(1.5)).toBe(false);
      expect(validation.isPositiveInteger("1")).toBe(false);
    });
  });

  describe("isNonNegativeNumber", () => {
    it("accepts non-negative numbers", () => {
      expect(validation.isNonNegativeNumber(0)).toBe(true);
      expect(validation.isNonNegativeNumber(100)).toBe(true);
      expect(validation.isNonNegativeNumber(50.5)).toBe(true);
    });

    it("rejects negative numbers and non-numbers", () => {
      expect(validation.isNonNegativeNumber(-1)).toBe(false);
      expect(validation.isNonNegativeNumber("abc")).toBe(false);
    });
  });

  describe("required", () => {
    it("returns missing fields", () => {
      const result = validation.required(["name", "email"], { name: "John" });
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["email"]);
    });

    it("returns valid when all fields present", () => {
      const result = validation.required(["name", "email"], { name: "John", email: "john@example.com" });
      expect(result.valid).toBe(true);
    });
  });

  describe("parsePagination", () => {
    it("parses valid pagination", () => {
      const result = validation.parsePagination({ page: "2", pageSize: "10" });
      expect(result.valid).toBe(true);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.offset).toBe(10);
    });

    it("returns undefined when no pagination", () => {
      const result = validation.parsePagination({});
      expect(result.valid).toBe(true);
      expect(result.page).toBeUndefined();
      expect(result.pageSize).toBeUndefined();
    });

    it("rejects invalid page", () => {
      const result = validation.parsePagination({ page: "0" });
      expect(result.valid).toBe(false);
    });
  });

  describe("pickAllowedFields", () => {
    it("picks only allowed fields", () => {
      const picked = validation.pickAllowedFields(["name", "email"], { name: "John", email: "john@example.com", password: "secret" });
      expect(picked).toEqual({ name: "John", email: "john@example.com" });
    });

    it("returns empty object when body is null", () => {
      const picked = validation.pickAllowedFields(["name"], null);
      expect(picked).toEqual({});
    });
  });

  describe("isInEnum", () => {
    it("accepts allowed values", () => {
      expect(validation.isInEnum("draft", ["draft", "published"])).toBe(true);
    });

    it("rejects disallowed values", () => {
      expect(validation.isInEnum("deleted", ["draft", "published"])).toBe(false);
    });
  });
});
