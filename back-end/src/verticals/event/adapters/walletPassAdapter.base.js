"use strict";

class WalletPassAdapter {
  constructor(platformName) {
    this.platformName = platformName;
  }

  async sign(_designSnapshot, _tenantId) {
    throw new Error(`sign() not implemented for ${this.platformName}`);
  }

  async verify(_artifactPath) {
    return true;
  }

  getPlatformName() {
    return this.platformName;
  }
}

module.exports = WalletPassAdapter;
