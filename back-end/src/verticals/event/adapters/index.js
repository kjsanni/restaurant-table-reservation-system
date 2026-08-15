"use strict";

const AppleWalletAdapter = require("./appleWalletAdapter");
const GoogleWalletAdapter = require("./googleWalletAdapter");
const SamsungPayAdapter = require("./samsungPayAdapter");
const logger = require("../../../utils/logger");

const adapters = {
  apple: new AppleWalletAdapter(),
  google: new GoogleWalletAdapter(),
  samsung: new SamsungPayAdapter(),
};

const SUPPORTED_PLATFORMS = Object.keys(adapters);

const getAdapter = (platform) => {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported wallet platform: ${platform}. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`);
  }
  return adapter;
};

const signAllPlatforms = async (designSnapshot, tenantId) => {
  const results = {};
  const errors = {};

  for (const platform of SUPPORTED_PLATFORMS) {
    try {
      const adapter = getAdapter(platform);
      const result = await adapter.sign(designSnapshot, tenantId);
      results[platform] = result;
      logger.info(`Wallet pass signed for platform ${platform}`, { tenantId, platform });
    } catch (err) {
      errors[platform] = err.message;
      logger.error(`Wallet pass signing failed for platform ${platform}`, {
        error: err.message,
        tenantId,
        platform,
      });
      results[platform] = null;
    }
  }

  return { results, errors, platforms: SUPPORTED_PLATFORMS };
};

module.exports = {
  adapters,
  getAdapter,
  signAllPlatforms,
  SUPPORTED_PLATFORMS,
};
