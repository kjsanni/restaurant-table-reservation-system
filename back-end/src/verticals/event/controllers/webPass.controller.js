"use strict";

const crypto = require("crypto");
const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");
const walletPassService = require("./walletPass.service");
const cache = require("../../../utils/cache");
const logger = require("../../../utils/logger");

const webPassController = {};

webPassController.viewPass = async (req, res) => {
  const { shortCode } = req.params;

  if (!shortCode || !/^[a-f0-9]{16}$/.test(shortCode)) {
    return res.status(400).send(generateErrorPage("Invalid ticket link", "The link you followed is invalid."));
  }

  const cacheKey = `event_pass:${shortCode}`;
  const cached = await cache.get(cacheKey);
  if (!cached) {
    return res.status(410).send(generateErrorPage("Link Expired", "This ticket link has expired. Please contact the event organizer."));
  }

  const decoded = JSON.parse(cached);
  const { ticketId, tenantId, rawToken, sig } = decoded;

  if (!sig) {
    return res.status(500).send(generateErrorPage("Server Error", "Ticket data is incomplete."));
  }

  const secret = await qrCodeService.loadQrSecret(tenantId);
  if (!qrCodeService.verifySignature(rawToken, sig, secret)) {
    return res.status(403).send(generateErrorPage("Invalid Ticket", "This ticket could not be verified."));
  }

  const tokenHash = qrCodeDAO.hashToken(rawToken);
  const qrCode = await qrCodeDAO.findByTokenHash(tokenHash, tenantId);

  if (!qrCode) {
    return res.status(404).send(generateErrorPage("Ticket Not Found", "The ticket associated with this link could not be found."));
  }

  const event = await db.Event.findOne({
    where: { id: qrCode.eventId, tenantId: qrCode.tenantId },
  });

  const photoUrl = qrCode.photoRef
    ? `${process.env.PLATFORM_BASE_URL || ""}/api/v1/events/checkin/photo/${qrCode.photoRef}`
    : null;

  if (req.headers.accept?.includes("application/vnd.apple.pkpass") || req.query.format === "pkpass") {
    try {
      const pass = await walletPassService.generateWalletPass(qrCode.toJSON(), tenantId);
      res.setHeader("Content-Type", pass.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${pass.filename}"`);
      res.sendFile(pass.pkpassPath);
      return;
    } catch (err) {
      logger.error("Wallet pass generation failed", { ticketId, error: err.message });
      return res.status(500).send(generateErrorPage("Pass Generation Failed", "Could not generate Apple Wallet pass."));
    }
  }

  if (req.query.format === "google") {
    const googlePayJwt = generateGooglePayJwt(qrCode, event, tenantId);
    return res.json({ googlePayJwt });
  }

  const html = generatePassPage({
    event: { name: event?.name, venue: event?.venue, date: event?.eventDate },
    attendee: {
      name: qrCode.attendeeName || "Guest",
      seat: qrCode.seat,
      tier: qrCode.tier,
      ticketType: qrCode.ticketType,
      photoUrl,
    },
    ticket: {
      id: qrCode.id,
      tokenHash: qrCode.tokenHash,
      expiresAt: qrCode.expiresAt,
      status: qrCode.status,
    },
    shortCode,
    baseUrl: process.env.PLATFORM_BASE_URL || "",
  });

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};

const generateGooglePayJwt = (qrCode, event, tenantId) => {
  const payload = {
    iss: process.env.GOOGLE_PAY_ISSUER_ID || "event-tickets",
    aud: "google-pay",
    typ: "event-ticket",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
    event: {
      name: event?.name,
      venue: event?.venue,
      date: event?.eventDate,
    },
    attendee: {
      name: qrCode.attendeeName,
      seat: qrCode.seat,
      tier: qrCode.tier,
    },
    ticketId: qrCode.id,
    tokenHash: qrCode.tokenHash,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const secret = process.env.GOOGLE_PAY_JWT_SECRET || process.env.EVENT_QR_SECRET || "dev-qr-secret-change-me";
  const signature = crypto.createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");

  return `${headerB64}.${payloadB64}.${signature}`;
};

const generateErrorPage = (title, message) => {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:sans-serif;text-align:center;padding:48px;background:#f8f9fa;}</style></head>
    <body><h1>${title}</h1><p style="color:#6c757d;font-size:16px;">${message}</p>
    <p style="margin-top:32px;"><a href="/" style="color:#0d6efd;">Return to event</a></p></body></html>`;
};

const generatePassPage = (data) => {
  const { event, attendee, ticket, shortCode, baseUrl } = data;
  const appleWalletUrl = `${baseUrl}/e/${shortCode}?format=pkpass`;
  const googlePayUrl = `${baseUrl}/e/${shortCode}?format=google`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.name} - Ticket</title>
  <meta name="apple-itunes-app" content="app-id=${process.env.APPLE_APP_ID || ''}, app-argument=${baseUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8f9fa; padding: 16px; }
    .container { max-width: 480px; margin: 0 auto; }
    .card { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .event-name { font-size: 24px; font-weight: 700; color: #1a1a1a; }
    .event-detail { color: #6c757d; font-size: 14px; margin-top: 4px; }
    .photo { width: 100px; height: 100px; border-radius: 50%; margin: 24px auto; background: #e9ecef; overflow: hidden; }
    .photo img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #adb5bd; font-size: 32px; }
    .attendee-name { text-align: center; font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #e9ecef; color: #495057; margin: 4px; }
    .add-buttons { display: flex; gap: 12px; flex-direction: column; }
    .btn { flex: 1; padding: 16px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-apple { background: #000; color: #fff; }
    .btn-google { background: #4285f4; color: #fff; }
    .qr-section { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e9ecef; }
    .qr-code { font-family: monospace; font-size: 13px; background: #f1f3f5; padding: 8px 12px; border-radius: 6px; display: inline-block; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="event-name">${event.name || "Event Ticket"}</div>
      <div class="event-detail">${event.venue || ""}</div>
      <div class="event-detail">${event.date ? new Date(event.date).toLocaleDateString() : ""}</div>
    </div>

    <div class="card">
      <div class="photo">
        ${attendee.photoUrl
          ? `<img src="${attendee.photoUrl}" alt="${attendee.name}">`
          : `<div class="photo-placeholder">\u{1F466}</div>`
        }
      </div>
      <div class="attendee-name" style="margin-top: 16px;">${attendee.name || "Guest"}</div>
      <div style="text-align: center; margin-top: 12px;">
        ${attendee.seat ? `<span class="badge">Seat: ${attendee.seat}</span>` : ""}
        ${attendee.tier ? `<span class="badge">${attendee.tier} Tier</span>` : ""}
        ${attendee.ticketType ? `<span class="badge">${attendee.ticketType}</span>` : ""}
      </div>
    </div>

    <div class="add-buttons">
      <a href="${appleWalletUrl}" class="btn btn-apple">
        <span>\u{1F512}</span> Add to Apple Wallet
      </a>
      <a href="${googlePayUrl}" class="btn btn-google">
        <span>\u{1F4F6}</span> Add to Google Pay
      </a>
    </div>

    <div class="qr-section">
      <p style="font-size: 12px; color: #6c757d; margin-bottom: 12px;">Show this ticket at the gate</p>
      <div class="qr-code">${ticket.tokenHash?.substring(0, 16) || "N/A"}...</div>
      <p style="font-size: 12px; color: #6c757d; margin-top: 8px;">Ticket ID: #${ticket.id}</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { webPassController, generateGooglePayJwt };
