describe("shaqexpress.service", () => {
  const crypto = require("crypto");

  describe("verifyWebhookSignature", () => {
    const verifyWebhookSignature = require("../services/shaqexpress.service").verifyWebhookSignature;

    it("returns true when signature matches HMAC of payload", () => {
      const payload = { event: "test", data: {} };
      const secret = "my-secret";
      const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it("returns false when signature does not match", () => {
      const payload = { event: "test", data: {} };
      const secret = "my-secret";

      const result = verifyWebhookSignature(payload, "wrong-sig", secret);
      expect(result).toBe(false);
    });

    it("returns false when signature is missing", () => {
      const payload = { event: "test", data: {} };
      const secret = "my-secret";

      const result = verifyWebhookSignature(payload, null, secret);
      expect(result).toBe(false);
    });

    it("returns false when secret is missing", () => {
      const payload = { event: "test", data: {} };
      const signature = "some-sig";

      const result = verifyWebhookSignature(payload, signature, null);
      expect(result).toBe(false);
    });
  });
});