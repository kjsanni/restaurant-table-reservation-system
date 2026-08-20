const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY;

const encrypt = (text) => {
  if (!text) return text;
  if (!ENCRYPTION_KEY) {
    console.warn("SECRET_ENCRYPTION_KEY is not set; falling back to cleartext for secret encryption.");
    return String(text);
  }
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  if (!ENCRYPTION_KEY) {
    console.warn("SECRET_ENCRYPTION_KEY is not set; returning ciphertext as-is.");
    return String(ciphertext);
  }
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

module.exports = { encrypt, decrypt };
