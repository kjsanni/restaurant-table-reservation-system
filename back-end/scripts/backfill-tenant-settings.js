#!/usr/bin/env node
"use strict";

const db = require("../src/db/models");
const { TYPE_DEFAULTS } = require("../src/tenant-platform/services/tenantTypeDefaults.service");

(async () => {
  const [results] = await db.sequelize.query(`
    SELECT id, name, slug, restaurantType, businessVertical, settings, serviceModes
    FROM tenants
    WHERE settings IS NULL OR JSON_LENGTH(settings) = 0
  `);

  const tenants = results.map(row => ({
    ...row,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    serviceModes: typeof row.serviceModes === 'string' ? JSON.parse(row.serviceModes) : row.serviceModes,
  }));

  console.log(`Found ${tenants.length} tenants with null settings`);

  for (const row of tenants) {
    const defaults = TYPE_DEFAULTS[row.restaurantType] || TYPE_DEFAULTS.full_service;
    const settings = {
      featureFlags: { ...defaults.featureFlags },
    };

    if (row.businessVertical === "salon") {
      if (defaults.salonDefaults) {
        Object.assign(settings, defaults.salonDefaults);
      }
    }

    await db.tenant.update(
      {
        settings,
        serviceModes: defaults.serviceModes,
      },
      { where: { id: row.id } }
    );

    console.log(`Backfilled ${row.name} (${row.slug}): ${JSON.stringify(settings)}`);
  }

  console.log("Backfill complete");
  await db.sequelize.close();
})();
