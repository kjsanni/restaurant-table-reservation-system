"use strict";

const db = require("../../../db/models");
const { signAllPlatforms, getAdapter, SUPPORTED_PLATFORMS } = require("../adapters");
const logger = require("../../../utils/logger");

const walletPassService = {};

walletPassService.signAllPlatforms = async (designSnapshot, tenantId) => {
  const result = await signAllPlatforms(designSnapshot, tenantId);

  for (const [platform, artifact] of Object.entries(result.results)) {
    if (artifact) {
      logger.info(`Signed wallet pass artifact for ${platform}`, { tenantId, platform });
    }
  }

  return result;
};

walletPassService.signForPlatform = async (platform, designSnapshot, tenantId) => {
  const adapter = getAdapter(platform);
  const artifact = await adapter.sign(designSnapshot, tenantId);

  return {
    platform,
    ...artifact,
  };
};

walletPassService.getSupportedPlatforms = () => SUPPORTED_PLATFORMS;

walletPassService.loadTenantDesign = async (tenantId) => {
  const settings = await db.setting.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: {
      tenantId,
      key: [
        db.Sequelize.literal("'wallet_pass_design'"),
        db.Sequelize.literal("'wallet_pass_template'"),
        db.Sequelize.literal("'event_qr_secret'"),
      ],
    },
  });

  const settingMap = {};
  settings.forEach((s) => { settingMap[s.key] = s.value; });

  const design = settingMap.wallet_pass_design || settingMap.wallet_pass_template || {};

  return {
    design: design || {},
    config: {
      qrSecret: settingMap.event_qr_secret || process.env.EVENT_QR_SECRET,
    },
  };
};

walletPassService.generateArtifact = async (ticketData, tenantId) => {
  const tenantDesign = await walletPassService.loadTenantDesign(tenantId);

  const designSnapshot = {
    design: tenantDesign.design,
    config: tenantDesign.config,
    ticketData,
  };

  return await walletPassService.signAllPlatforms(designSnapshot, tenantId);
};

module.exports = walletPassService;
