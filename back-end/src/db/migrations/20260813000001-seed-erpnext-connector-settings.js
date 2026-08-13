"use strict";

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      'SELECT `key` FROM `settings` WHERE `key` IN (:keys)',
      {
        replacements: { keys: ["erpnext_base_url", "erpnext_api_key", "erpnext_api_secret", "erpnext_timeout_ms", "erpnext_cache_ttl"] },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const existingKeys = new Set(existing.map((r) => r.key));
    const toInsert = [];

    const envSettings = {
      erpnext_base_url: process.env.ERPNEXT_BASE_URL || "",
      erpnext_api_key: process.env.ERPNEXT_API_KEY || "",
      erpnext_api_secret: process.env.ERPNEXT_API_SECRET || "",
      erpnext_timeout_ms: process.env.ERPNEXT_TIMEOUT_MS || "30000",
      erpnext_cache_ttl: process.env.ERPNEXT_CACHE_TTL || "300",
    };

    const descriptions = {
      erpnext_base_url: "ERPNext server base URL for REST API",
      erpnext_api_key: "ERPNext API key for authentication (secret)",
      erpnext_api_secret: "ERPNext API secret for authentication (secret)",
      erpnext_timeout_ms: "ERPNext API request timeout in milliseconds",
      erpnext_cache_ttl: "ERPNext API response cache TTL in seconds",
    };

    for (const [key, defaultValue] of Object.entries(envSettings)) {
      if (!existingKeys.has(key)) {
        toInsert.push({
          key,
          value: JSON.stringify(defaultValue),
          description: descriptions[key],
          tenantId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("settings", toInsert, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM `settings` WHERE `key` IN (:keys)',
      {
        replacements: {
          keys: [
            "erpnext_base_url",
            "erpnext_api_key",
            "erpnext_api_secret",
            "erpnext_timeout_ms",
            "erpnext_cache_ttl",
          ],
        },
      }
    );
  },
};
