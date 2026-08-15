"use strict";

const crypto = require("crypto");
const db = require("../../../db/models");
const logger = require("../../../utils/logger");
const WalletPassAdapter = require("./walletPassAdapter.base");

class GoogleWalletAdapter extends WalletPassAdapter {
  constructor() {
    super("google");
  }

  async loadGoogleConfig() {
    const platformSettings = await db.setting.findAll({
      where: {
        tenantId: null,
        key: [
          db.Sequelize.literal("'google_pay_issuer_id'"),
          db.Sequelize.literal("'google_pay_account_email'"),
          db.Sequelize.literal("'google_pay_private_key'"),
          db.Sequelize.literal("'google_pay_base_url'"),
        ],
      },
    });

    const settingMap = {};
    platformSettings.forEach((s) => {
      settingMap[s.key] = s.value;
    });

    const issuerId =
      settingMap.google_pay_issuer_id || process.env.GOOGLE_PAY_ISSUER_ID || "event-tickets";
    const accountEmail =
      settingMap.google_pay_account_email || process.env.GOOGLE_PAY_ACCOUNT_EMAIL;
    const privateKey =
      settingMap.google_pay_private_key || process.env.GOOGLE_PAY_PRIVATE_KEY;
    const baseUrl =
      settingMap.google_pay_base_url ||
      process.env.GOOGLE_PAY_BASE_URL ||
      "https://walletdemo.android.com";

    return { issuerId, accountEmail, privateKey, baseUrl };
  }

  buildJwtPayload(design, qrCodeData, config) {
    const payload = {
      iss: config.accountEmail,
      aud: "google-pay",
      typ: "event-ticket",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      event: {
        name: qrCodeData.eventName || "Event",
        venue: qrCodeData.venue || "",
        date: qrCodeData.eventDate || null,
      },
      attendee: {
        name: qrCodeData.attendeeName || "Guest",
        seat: qrCodeData.seat,
        tier: qrCodeData.tier,
        ticketType: qrCodeData.ticketType,
      },
      ticketId: qrCodeData.id,
      tokenHash: qrCodeData.tokenHash,
      serialNumber: qrCodeData.id,
      passTypeIdentifier: config.issuerId,
      classId: `${config.issuerId}.${qrCodeData.eventId || "default"}`,
      design: design || {},
    };

    return payload;
  }

  async sign(designSnapshot, tenantId) {
    const { JWT } = require("google-auth-library");
    const config = await this.loadGoogleConfig();

    if (!config.privateKey || !config.accountEmail) {
      throw new Error("Google Pay signing credentials not configured (private key or service account email missing)");
    }

    const design = designSnapshot.design || {};
    const qrCodeData = designSnapshot.ticketData || {};

    const token = new JWT({
      email: config.accountEmail,
      privateKey: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/wallet.transport"],
    });

    const client = await token.getClient();
    const ticketClass = {
      resource: {
        id: `${config.issuerId}.${qrCodeData.eventId || "default"}`,
        classTemplateInfo: {
          cardTemplate: {
            globe: {
              cardRowArguments: {
                firstRow: {
                  columns: [
                    {
                      item: {
                        contentDescription: {
                          text: {
                            text: qrCodeData.eventName || "Event Ticket",
                            localization: {
                              translatedValues: [],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    let classId;
    try {
       await client.request({
        url: `https://walletdemo.android.com/walleto/v1/eventTicketClass/${ticketClass.resource.id}`,
        method: "PUT",
        data: ticketClass.resource,
      });
      classId = ticketClass.resource.id;
    } catch (classErr) {
      logger.warn("Google Wallet class upsert failed, using default class", {
        error: classErr.message,
        tenantId,
      });
      classId = `${config.issuerId}.${qrCodeData.eventId || "default"}`;
    }

    const objectId = `${config.issuerId}.${qrCodeData.id || crypto.randomBytes(8).toString("hex")}`;
    const ticketObject = {
      resource: {
        id: objectId,
        classId,
        state: "active",
        heroImage: design.heroImageUrl ? { sourceUri: { uri: design.heroImageUrl } } : undefined,
        textModulesData: [
          {
            header: "Attendee",
            body: qrCodeData.attendeeName || "Guest",
            id: "attendee",
          },
          qrCodeData.seat
            ? { header: "Seat", body: qrCodeData.seat, id: "seat" }
            : undefined,
        ].filter(Boolean),
        barcode: {
          type: "qrCode",
          value: JSON.stringify({
            token: qrCodeData.tokenHash,
            eventId: qrCodeData.eventId,
            signature: crypto
              .createHmac("sha256", process.env.EVENT_QR_SECRET)
              .update(qrCodeData.tokenHash)
              .digest("hex"),
          }),
        },
        validityPeriod: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
        },
      },
    };

    try {
      await client.request({
        url: `https://walletdemo.android.com/walleto/v1/eventTicketObject/${objectId}`,
        method: "PUT",
        data: ticketObject.resource,
      });
    } catch (objErr) {
      logger.error("Google Wallet object creation failed", {
        error: objErr.message,
        tenantId,
        objectId,
      });
      throw new Error(`Google Wallet object creation failed: ${objErr.message}`);
    }

    const jwt = new JWT({
      email: config.accountEmail,
      privateKey: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/wallet.transport"],
    });

    const jwtToken = await jwt.sign({
      iss: config.accountEmail,
      aud: "google-pay",
      typ: "event-ticket",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      payload: { eventTicketObjects: [{ id: objectId, classId }] },
    });

    const deepLink = `https://pay.google.com/kg/pay/${jwtToken}`;

    return {
      artifactType: "url",
      artifactPath: deepLink,
      accessToken: jwtToken,
      signingResult: { objectId, classId, provider: "google-pay" },
    };
  }
}

module.exports = GoogleWalletAdapter;
