"use strict";

class WalletPassAdapter {
  constructor(platformName) {
    this.platformName = platformName;
  }

  async sign(designSnapshot, tenantId) {
    throw new Error(`sign() not implemented for ${this.platformName}`);
  }

  async verify(artifactPath) {
    return true;
  }

  getPlatformName() {
    return this.platformName;
  }
}

module.exports = WalletPassAdapter;
