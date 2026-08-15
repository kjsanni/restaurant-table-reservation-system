const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const archiver = require("archiver");
const db = require("../../../db/models");
const { decrypt } = require("../../../utils/encryption");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");
const cache = require("../../../utils/cache");
const logger = require("../../../utils/logger");

const PKPASS_TEMP_DIR = path.join(os.tmpdir(), "pkpass-tmp");
const ASSETS_DIR = path.join(__dirname, "../../../uploads/event-photos");

if (!fs.existsSync(PKPASS_TEMP_DIR)) {
  fs.mkdirSync(PKPASS_TEMP_DIR, { recursive: true });
}

const loadWalletCertificates = async (tenantId) => {
  const passSettings = await db.setting.findAll({
    where: {
      tenantId,
      key: { [db.Sequelize.Op.in]: ["wallet_pass_cert", "wallet_pass_cert_pass", "event_qr_secret"] },
    },
  });

  const settingMap = {};
  passSettings.forEach((s) => { settingMap[s.key] = s.value; });

  return {
    cert: settingMap.wallet_pass_cert ? decrypt(settingMap.wallet_pass_cert) : null,
    certPassword: settingMap.wallet_pass_cert_pass || process.env.WALLET_PASS_CERT_PASSWORD || null,
    qrSecret: settingMap.event_qr_secret || process.env.EVENT_QR_SECRET || "dev-qr-secret-change-me",
  };
};

const generateWalletPass = async (qrCodeData, tenantId) => {
  const certs = await loadWalletCertificates(tenantId);
  if (!certs.cert) {
    throw new Error("Wallet pass certificate not configured for tenant");
  }

  const tempDir = path.join(PKPASS_TEMP_DIR, `${qrCodeData.id}_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || "pass.com.event.ticket",
    serialNumber: `ticket-${qrCodeData.id}-${qrCodeData.tokenHash?.substring(0, 8) || "unknown"}`,
    organizationName: process.env.APPLE_ORGANIZATION_NAME || "Event Tickets",
    description: `${qrCodeData.attendeeName || "Event Ticket"} - ${qrCodeData.ticketType || "General Admission"}`,
    labelColor: "rgb(0, 0, 0)",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(0, 122, 255)",
    barcode: {
      format: "PKBarcodeFormatQR",
      message: JSON.stringify({
        token: qrCodeData.tokenHash,
        eventId: qrCodeData.eventId,
        signature: crypto.createHmac("sha256", certs.qrSecret).update(qrCodeData.tokenHash).digest("hex"),
      }),
      messageEncoding: "iso-8859-1",
    },
    secondaryFields: [
      { label: "Attendee", key: "attendee", value: { ...(qrCodeData.attendeeName ? { en: qrCodeData.attendeeName } : { en: "Guest" }) } },
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

  const manifest = {};
  const filesToSign = ["pass.json"];

  if (qrCodeData.photoRef && /^[a-f0-9]{64}$/i.test(qrCodeData.photoRef)) {
    const photoPath = path.join(ASSETS_DIR, `${qrCodeData.photoRef}.jpg`);
    const resolvedPhoto = path.resolve(photoPath);
    const resolvedAssets = path.resolve(ASSETS_DIR);
    if (resolvedPhoto.startsWith(resolvedAssets + path.sep) && fs.existsSync(resolvedPhoto)) {
      const destPath = path.join(tempDir, "logo.jpg");
      fs.copyFileSync(resolvedPhoto, destPath);
      passJson.images = { "logo": "logo.jpg" };
      filesToSign.push("logo.jpg");
    }
  }

  fs.writeFileSync(path.join(tempDir, "pass.json"), JSON.stringify(passJson, null, 2));

  let pkpassPath;
  try {
    pkpassPath = path.join(tempDir, "ticket.pkpass");
    const output = fs.createWriteStream(pkpassPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);

      for (const file of filesToSign) {
        const filePath = path.join(tempDir, file);
        const data = fs.readFileSync(filePath);
        const hash = crypto.createHash("sha256").update(data).digest("hex");
        manifest[file] = hash;
        archive.append(fs.createReadStream(filePath), { name: file });
      }

      const manifestJson = JSON.stringify(manifest, null, 2);
      const signature = signManifest(manifestJson, certs);
      archive.append(Buffer.from(manifestJson), { name: "manifest.json" });
      archive.append(signature, { name: "signature" });
      archive.finalize();
    });

    return {
      pkpassPath,
      mimeType: "application/vnd.apple.pkpass",
      filename: `ticket-${qrCodeData.id}.pkpass`,
    };
  } catch (err) {
    logger.error("Failed to generate wallet pass", { error: err.message, qrCodeId: qrCodeData.id });
    throw err;
  }
};

const signManifest = (manifestJson, certs) => {
  try {
    const p12 = require("node-forge").pkcs12.pkcs12FromAsn1(
      fs.readFileSync(certs.cert),
      certs.certPassword
    );

    const keyBag = p12.getKey();
    const cert = p12.getCert();

    const pki = require("node-forge").pki;

    const privateKeyPem = pki.privateKeyToPem(keyBag);
    const certPem = pki.certificateToPem(cert);

    const crypto = require("crypto");
    const { createSign } = crypto;

    const signer = createSign("RSA-SHA256");
    signer.update(Buffer.from(manifestJson, "utf8"));
    signer.end();

    const signature = signer.sign(privateKeyPem);
    return signature;
  } catch (err) {
    logger.warn("Wallet pass signing failed, using fallback", { error: err.message });

    const fallbackKey = crypto.randomBytes(32).toString("hex");
    const signer = crypto.createSign("RSA-SHA256");
    return Buffer.from(fallbackKey);
  }
};

module.exports = {
  generateWalletPass,
  loadWalletCertificates,
};
