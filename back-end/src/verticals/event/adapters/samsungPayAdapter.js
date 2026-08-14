"use strict";

const crypto = require("crypto");
const https = require("https");
const db = require("../../../db/models");
const logger = require("../../../utils/logger");
const WalletPassAdapter = require("./walletPassAdapter.base");

class SamsungPayAdapter extends WalletPassAdapter {
  constructor() {
    super("samsung");
  }

  async loadSamsungConfig() {
    const platformSettings = await db.setting.findAll({
      where: {
        tenantId: null,
        key: [
          db.Sequelize.literal("'samsung_pay_partner_id'"),
          db.Sequelize.literal("'samsung_pay_service_id'"),
          db.Sequelize.literal("'samsung_pay_private_key'"),
          db.Sequelize.literal("'samsung_pay_base_url'"),
        ],
      },
    });

    const settingMap = {};
    platformSettings.forEach((s) => {
      settingMap[s.key] = s.value;
    });

    return {
      partnerId: settingMap.samsung_pay_partner_id || process.env.SAMSUNG_PARTNER_ID,
      serviceId: settingMap.samsung_pay_service_id || process.env.SAMSUNG_SERVICE_ID,
      privateKey: settingMap.samsung_pay_private_key || process.env.SAMSUNG_PAY_PRIVATE_KEY,
      baseUrl:
        settingMap.samsung_pay_base_url ||
        process.env.SAMSUNG_PAY_BASE_URL ||
        "https://dev.tpayapi.com",
    };
  }

  buildPayload(design, qrCodeData, config) {
    return {
      partnerId: config.partnerId,
      serviceId: config.serviceId,
      transactionId: `ticket-${qrCodeData.id}-${Date.now()}`,
      ticketInfo: {
        serialNumber: `ticket-${qrCodeData.id}`,
        attendeeName: qrCodeData.attendeeName || "Guest",
        eventId: qrCodeData.eventId,
        ticketType: qrCodeData.ticketType || "General",
        seat: qrCodeData.seat,
        tier: qrCodeData.tier,
        barcodeData: JSON.stringify({
          token: qrCodeData.tokenHash,
          eventId: qrCodeData.eventId,
        }),
      },
    };
  }

  signPayload(payload, privateKeyPem) {
    if (!privateKeyPem) {
      throw new Error("Samsung Pay private key not configured");
    }

    const payloadJson = JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(payloadJson).digest("hex");
    const signature = crypto.createSign("RSA-SHA256").update(payloadJson).sign(privateKeyPem, "base64");

    return { payloadJson, hash, signature };
  }

  async httpRequest(options, body) {
    return new Promise((resolve, reject) => {
      const req = https.request({ ...options, rejectUnauthorized: true }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: data });
          } else {
            reject(new Error(`Samsung Pay API error: ${res.statusCode}`));
          }
        });
      });
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  }

  buildSamsungRequestOptions(config, payload, signature) {
    const parsedUrl = new URL(config.baseUrl);
    const samsungPath = `/mpayment/v1.0/credentials/${config.partnerId}/service/${config.serviceId}/walletinfo`;
    return {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: samsungPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Samsung-Partner-ID": config.partnerId,
        "X-Samsung-Service-ID": config.serviceId,
        "X-Samsung-Signature": signature,
        "X-Samsung-Signature-Algorithm": "RSA-SHA256",
      },
    };
  }

  async sign(designSnapshot, tenantId) {
    const config = await this.loadSamsungConfig();

    if (!config.partnerId || !config.serviceId || !config.privateKey) {
      throw new Error(
        "Samsung Pay credentials not configured (partnerId, serviceId, privateKey required)"
      );
    }

    const design = designSnapshot.design || {};
    const qrCodeData = designSnapshot.ticketData || {};

    const payload = this.buildPayload(design, qrCodeData, config);
    const { payloadJson, signature } = this.signPayload(payload, config.privateKey);

    const options = this.buildSamsungRequestOptions(config, payload, signature); // nosemgrep: javascript.lang.security.audit.http-to-https - URL comes from platform-managed tenant config, validated at admin layer

    let apiResponse;
    try {
      const response = await this.httpRequest(options, payloadJson);
      apiResponse = JSON.parse(response.body);
    } catch (err) {
      logger.error("Samsung Pay API call failed", {
        error: err.message,
        tenantId,
        transactionId: payload.transactionId,
      });
      throw new Error("Samsung Pay API call failed");
    }

    const deepLink = apiResponse?.walletLink || apiResponse?.deepLink || apiResponse?.link;
    if (!deepLink) {
      throw new Error("Samsung Pay API did not return a deep link URL");
    }

    return {
      artifactType: "url",
      artifactPath: deepLink,
      accessToken: apiResponse?.accessToken || null,
      signingResult: {
        transactionId: payload.transactionId,
        provider: "samsung-pay",
        partnerId: config.partnerId,
        serviceId: config.serviceId,
      },
    };
  }
}

module.exports = SamsungPayAdapter;
