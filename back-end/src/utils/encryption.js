"use strict";

const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required for encrypted fields."
  );
}

const KEY = crypto
  .createHash("sha256")
  .update(ENCRYPTION_KEY)
  .digest();

const ALGORITHM = "aes-256-gcm";

const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
};

module.exports = { encrypt, decrypt };
