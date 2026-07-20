"use strict";

const { QueryInterface } = require("sequelize");

/**
 * Encrypt existing plaintext `paystackSecretKey` values in the `tenants` table.
 *
 * Prerequisite: `ENCRYPTION_KEY` must be set in the environment before this
 * migration runs. Without it the app cannot decrypt any stored keys.
 *
 * This migration is idempotent: already-encrypted values (base64-encoded
 * AES-256-GCM ciphertext) are detected by length and skipped.
 */
module.exports = {
  async up(queryInterface) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error(
        "ENCRYPTION_KEY environment variable is required to run the encrypt-paystack-keys migration."
      );
    }

    const { encrypt } = require("../../utils/encryption");

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, paystackSecretKey FROM tenants WHERE paystackSecretKey IS NOT NULL`
    );

    for (const row of rows) {
      const raw = row.paystackSecretKey;
      if (!raw) continue;

      // Skip values that already look like encrypted ciphertext
      // (base64-encoded AES-256-GCM: 12-byte IV + 16-byte tag + >=1 byte ciphertext)
      try {
        const decoded = Buffer.from(raw, "base64");
        if (decoded.length >= 29) continue;
      } catch {
        // not valid base64 — treat as plaintext
      }

      const encrypted = encrypt(raw);
      await queryInterface.sequelize.query(
        `UPDATE tenants SET paystackSecretKey = :encrypted WHERE id = :id`,
        {
          replacements: { encrypted, id: row.id },
        }
      );
    }
  },

  async down() {
    // Cannot safely decrypt without ENCRYPTION_KEY; leave as-is.
    // If rollback is required, restore from backup.
  },
};
