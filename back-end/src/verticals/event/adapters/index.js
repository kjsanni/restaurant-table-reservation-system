const AppleWalletAdapter = require("./appleWalletAdapter");
const GoogleWalletAdapter = require("./googleWalletAdapter");
const SamsungPayAdapter = require("./samsungPayAdapter");

const SUPPORTED_PLATFORMS = ["apple", "google", "samsung"];

const adapters = {
  apple: new AppleWalletAdapter(),
  google: new GoogleWalletAdapter(),
  samsung: new SamsungPayAdapter(),
};

const getAdapter = (platform) => {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported wallet platform: ${platform}`);
  }
  return adapter;
};

const signAllPlatforms = async (designSnapshot, tenantId) => {
  const results = {};
  const errors = {};

  for (const platform of SUPPORTED_PLATFORMS) {
    try {
const signAllPlatforms = async (designSnapshot, tenantId) => {
  const results = {};
  const errors = {};

  for (const platform of SUPPORTED_PLATFORMS) {
    try {
      const adapter = getAdapter(platform);
      results[platform] = await adapter.sign(designSnapshot, tenantId);
    } catch (err) {
      errors[platform] = err.message;
    }
  }

  return { results, errors, platforms: SUPPORTED_PLATFORMS };
};
    } catch (err) {
      errors[platform] = err.message;
    }
  }

  return { results, errors, platforms: SUPPORTED_PLATFORMS };
};

module.exports = {
  SUPPORTED_PLATFORMS,
  getAdapter,
  signAllPlatforms,
  AppleWalletAdapter,
  GoogleWalletAdapter,
  SamsungPayAdapter,
};
