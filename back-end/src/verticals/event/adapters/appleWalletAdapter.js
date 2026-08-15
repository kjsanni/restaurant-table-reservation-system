"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../../../db/models");
const { decrypt } = require("../../../utils/encryption");
const logger = require("../../../utils/logger");
const WalletPassAdapter = require("./walletPassAdapter.base");

const PKPASS_TEMP_DIR = path.join(__dirname, "../../../uploads/.pkpass-temp"); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - static __dirname path

if (!fs.existsSync(PKPASS_TEMP_DIR)) { // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - static directory path derived from __dirname
  fs.mkdirSync(PKPASS_TEMP_DIR, { recursive: true, mode: 0o700 }); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - static directory path derived from __dirname
}

class AppleWalletAdapter extends WalletPassAdapter {
  constructor() {
    super("apple");
  }

  async loadCertificates(tenantId) {
    const passSettings = await db.setting.findAll({
      where: {
        tenantId,
        key: [
          db.Sequelize.literal("'wallet_pass_cert'"),
          db.Sequelize.literal("'wallet_pass_cert_pass'"),
          db.Sequelize.literal("'wallet_pass_wwdr'"),
          db.Sequelize.literal("'event_qr_secret'"),
        ],
      },
    });

    const settingMap = {};
    passSettings.forEach((s) => {
      settingMap[s.key] = s.value;
    });

    const platformSettings = await db.setting.findAll({
      where: {
        tenantId: null,
        key: ["apple_wwdr_cert", "apple_pass_type_id", "apple_team_identifier", "apple_organization_name"],
      },
    });

    platformSettings.forEach((s) => {
      settingMap[s.key] = s.value;
    });

    return {
      cert: settingMap.wallet_pass_cert ? decrypt(settingMap.wallet_pass_cert) : null,
      certPassword: settingMap.wallet_pass_cert_pass || process.env.WALLET_PASS_CERT_PASSWORD,
      wwdr: settingMap.wallet_pass_wwdr || settingMap.apple_wwdr_cert || null,
      passTypeId: settingMap.apple_pass_type_id || process.env.APPLE_PASS_TYPE_ID,
      teamId: settingMap.apple_team_identifier || process.env.APPLE_TEAM_IDENTIFIER,
      orgName: settingMap.apple_organization_name || process.env.APPLE_ORGANIZATION_NAME || "Event Tickets",
      qrSecret: settingMap.event_qr_secret || process.env.EVENT_QR_SECRET,
    };
  }

  setPhotoOnPass(passJson, qrCodeData) {
    if (!qrCodeData.photoRef) return;
    const photoRef = String(qrCodeData.photoRef);
    if (!/^[a-f0-9]{64}$/i.test(photoRef)) return;
    const photoPath = path.join(__dirname, "../../../uploads/event-photos", `${photoRef}.jpg`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - photoRef validated as SHA-256 hex above
    const resolvedPhoto = path.resolve(photoPath); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - resolved path validated below
    const resolvedAssets = path.resolve(path.join(__dirname, "../../../uploads/event-photos")); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - static __dirname path
    if (resolvedPhoto.startsWith(resolvedAssets + path.sep) && fs.existsSync(resolvedPhoto)) { // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - path traversal check is in place above
      passJson.images = { logo: "logo.jpg" };
    }
  }

  buildPassJson(design, qrCodeData, certs) {
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: certs.passTypeId || "pass.com.event.ticket",
      serialNumber: `ticket-${qrCodeData.id}-${crypto.randomBytes(4).toString("hex")}`,
      organizationName: certs.orgName,
      description: `${qrCodeData.attendeeName || "Event Ticket"} - ${qrCodeData.ticketType || "General Admission"}`,
      labelColor: design?.labelColor || "rgb(0,0,0)",
      backgroundColor: design?.backgroundColor || "rgb(0,122,255)",
      foregroundColor: design?.foregroundColor || "rgb(255,255,255)",
      barcode: {
        format: "PKBarcodeFormatQR",
        message: JSON.stringify({
          token: qrCodeData.tokenHash,
          eventId: qrCodeData.eventId,
          signature: crypto
            .createHmac("sha256", certs.qrSecret)
            .update(qrCodeData.tokenHash)
            .digest("hex"),
        }),
        messageEncoding: "iso-8859-1",
      },
      secondaryFields: [
        {
          label: "Attendee",
          key: "attendee",
          value: { en: qrCodeData.attendeeName || "Guest" },
        },
      ],
      auxiliaryFields: [],
    };

    if (qrCodeData.seat) {
      passJson.secondaryFields.push({
        label: "Seat",
        key: "seat",
        value: { en: qrCodeData.seat },
      });
    }

    if (qrCodeData.tier) {
      passJson.auxiliaryFields.push({
        label: "Tier",
        key: "tier",
        value: { en: qrCodeData.tier },
      });
    }

    if (qrCodeData.ticketType) {
      passJson.auxiliaryFields.push({
        label: "Type",
        key: "ticketType",
        value: { en: qrCodeData.ticketType },
      });
    }

    if (design?.primaryFields) {
      passJson.primaryFields = design.primaryFields;
    }

    this.setPhotoOnPass(passJson, qrCodeData);

    return passJson;
  }

  createTempDir() {
    const tempDir = path.join(PKPASS_TEMP_DIR, `${Date.now()}_${process.pid}_${crypto.randomBytes(4).toString("hex")}`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - no user input
    fs.mkdirSync(tempDir, { recursive: true, mode: 0o700 }); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - validated tempDir above
    return tempDir;
  }

  copyLogoIfValid(tempDir, designSnapshot) {
    if (!designSnapshot.ticketData?.photoRef) return;
    const photoRef = String(designSnapshot.ticketData.photoRef);
    if (!/^[a-f0-9]{64}$/i.test(photoRef)) return;
    const photoPath = path.join(__dirname, "../../../uploads/event-photos", `${photoRef}.jpg`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - validated as SHA-256 hex above
    if (fs.existsSync(photoPath)) { // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - photoPath derived from validated photoRef
      const logoCopy = path.join(tempDir, "logo.jpg"); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - static filename in validated tempDir
      fs.copyFileSync(photoPath, logoCopy); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - photoPath validated above
    }
  }

  async createPKPass(passJsonPath, certs) {
    const PKPass = require("passkit-generator").PKPass;

    const pass = await PKPass.from(
      {
        passTypeIdentifier: certs.passTypeId || "pass.com.event.ticket",
        teamIdentifier: certs.teamId,
        organizationName: certs.orgName,
      },
      {
        secretKey: certs.cert,
        passphrase: certs.certPassword,
        wwdrCert: certs.wwdr,
      },
      {
        path: passJsonPath,
      }
    );

    const buffers = [];
    pass.on("data", (buf) => buffers.push(buf));
    await new Promise((resolve, reject) => {
      pass.on("end", resolve);
      pass.on("error", reject);
    });
    return Buffer.concat(buffers);
  }

  async sign(designSnapshot, tenantId) {
    const certs = await this.loadCertificates(tenantId);
    if (!certs.cert) {
      throw new Error("Apple Wallet pass certificate not configured for tenant");
    }

    const passJson = this.buildPassJson(designSnapshot.design || {}, designSnapshot.ticketData || {}, certs);

    const tempDir = this.createTempDir();
    const passJsonPath = path.join(tempDir, "pass.json"); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - static filename in validated tempDir
    fs.writeFileSync(passJsonPath, JSON.stringify(passJson, null, 2)); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - passJsonPath is in validated tempDir

    if (passJson.images?.logo) {
      this.copyLogoIfValid(tempDir, designSnapshot);
    }

    let pkpassBuffer;
    try {
      pkpassBuffer = await this.createPKPass(passJsonPath, certs);
    } catch (err) {
      logger.error("Apple Wallet pass signing failed", { error: err.message, tenantId });
      throw new Error("Apple pass signing failed");
    }

    const outputFile = path.join(tempDir, "ticket.pkpass"); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - static filename in validated tempDir
    fs.writeFileSync(outputFile, pkpassBuffer); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - outputFile is in validated tempDir

    setTimeout(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }, 30000);

    return {
      artifactType: "file",
      artifactPath: outputFile,
      accessToken: null,
      signingResult: { library: "passkit-generator", format: "pkpass" },
    };
  }
}

module.exports = AppleWalletAdapter;
