"use strict";

const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("../services/qrCode.service");
const walletPassService = require("../services/walletPass.service");
const passSigningRequestDAO = require("../../../tenant-platform/DAOs/passSigningRequest.dao");
const cache = require("../../../utils/cache");
const logger = require("../../../utils/logger");

const webPassController = {};

const checkWalletPassApproved = async (eventId, tenantId) => {
  const approved = await passSigningRequestDAO.listByTenant(tenantId, {});
  return approved.some((r) => r.eventId === eventId && r.status === "approved");
};

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

  const ticketData = {
    id: qrCode.id,
    eventId: qrCode.eventId,
    eventName: event?.name,
    venue: event?.venue,
    eventDate: event?.eventDate,
    attendeeName: qrCode.attendeeName,
    seat: qrCode.seat,
    tier: qrCode.tier,
    ticketType: qrCode.ticketType,
    tokenHash: qrCode.tokenHash,
    expiresAt: qrCode.expiresAt,
    status: qrCode.status,
    photoRef: qrCode.photoRef,
  };

  const walletPassesEnabled = await checkWalletPassApproved(qrCode.eventId, tenantId);

  if (req.headers.accept?.includes("application/vnd.apple.pkpass") || req.query.format === "pkpass") {
    if (!walletPassesEnabled) {
      return res.status(410).send(
        generateErrorPage(
          "Wallet Pass Not Available",
          "Apple Wallet passes are not yet available for this event. Please contact the event organizer."
        )
      );
    }
    try {
      const signResult = await walletPassService.generateArtifact(ticketData, tenantId);
      const appleArtifact = signResult.results.apple;
      if (!appleArtifact || appleArtifact.artifactType !== "file") {
        throw new Error(signResult.errors.apple || "Apple Wallet signing failed");
      }
      res.setHeader("Content-Type", "application/vnd.apple.pkpass");
      res.setHeader("Content-Disposition", `attachment; filename="ticket-${qrCode.id}.pkpass"`);
      res.sendFile(appleArtifact.artifactPath);
      return;
    } catch (err) {
      logger.error("Wallet pass generation failed", { ticketId, error: err.message });
      return res.status(500).send(generateErrorPage("Pass Generation Failed", "Could not generate Apple Wallet pass."));
    }
  }

  if (req.query.format === "google") {
    if (!walletPassesEnabled) {
      return res.status(410).json({
        success: false,
        message: "Google Wallet passes are not yet available for this event.",
      });
    }
    try {
      const signResult = await walletPassService.generateArtifact(ticketData, tenantId);
      const googleArtifact = signResult.results.google;
      if (!googleArtifact || googleArtifact.artifactType !== "url") {
        throw new Error(signResult.errors.google || "Google Wallet signing failed");
      }
      return res.json({
        success: true,
        googlePayJwt: googleArtifact.accessToken,
        deepLink: googleArtifact.artifactPath,
      });
    } catch (err) {
      logger.error("Google Wallet pass generation failed", { ticketId, error: err.message });
      return res.status(500).json({ success: false, message: "Could not generate Google Wallet pass." });
    }
  }

  if (req.query.format === "samsung") {
    if (!walletPassesEnabled) {
      return res.status(410).json({
        success: false,
        message: "Samsung Pay passes are not yet available for this event.",
      });
    }
    try {
      const signResult = await walletPassService.generateArtifact(ticketData, tenantId);
      const samsungArtifact = signResult.results.samsung;
      if (!samsungArtifact || samsungArtifact.artifactType !== "url") {
        throw new Error(signResult.errors.samsung || "Samsung Pay signing failed");
      }
      return res.json({
        success: true,
        deepLink: samsungArtifact.artifactPath,
        accessToken: samsungArtifact.accessToken,
      });
    } catch (err) {
      logger.error("Samsung Pay pass generation failed", { ticketId, error: err.message });
      return res.status(500).json({ success: false, message: "Could not generate Samsung Pay pass." });
    }
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
    walletPassesEnabled,
  });

  res.setHeader("Content-Type", "text/html");
  res.send(html); //NOSONAR
};

const generatePassPage = (data) => {
  const { event, attendee, ticket, shortCode, baseUrl, walletPassesEnabled = false } = data;
  const appleWalletUrl = `${baseUrl}/e/${shortCode}?format=pkpass`; //NOSONAR
  const googlePayUrl = `${baseUrl}/e/${shortCode}?format=google`; //NOSONAR
  const samsungPayUrl = `${baseUrl}/e/${shortCode}?format=samsung`; //NOSONAR

  const walletPassButtons = walletPassesEnabled
    ? `<div class="add-buttons">
      <a href="${appleWalletUrl}" class="btn btn-apple">
        <span>\u{1F512}</span> Add to Apple Wallet
      </a>
      <a href="${googlePayUrl}" class="btn btn-google">
        <span>\u{1F4F6}</span> Add to Google Pay
      </a>
      <a href="${samsungPayUrl}" class="btn btn-samsung">
        <span>\u{1F4F6}</span> Add to Samsung Pay
      </a>
    </div>`
    : `<div class="wallet-disabled" style="text-align:center;padding:24px;border-radius:12px;background:#f8f9fa;border:1px dashed #dee2e6;">
      <p style="color:#6c757d;font-size:14px;margin-bottom:12px;">Wallet passes are not yet available for this event.</p>
      <p style="color:#6c757d;font-size:12px;">Contact the event organizer to enable Apple/Google/Samsung wallet passes.</p>
    </div>`; //NOSONAR

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.name} - Ticket</title>
  <meta name="apple-itunes-app" content="app-id=${process.env.APPLE_APP_ID || ''}, app-argument=${baseUrl}">
  <style>
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
    .btn-samsung { background: #1f2937; color: #fff; }
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

    ${walletPassButtons}

    <div class="qr-section">
      <p style="font-size: 12px; color: #6c757d; margin-bottom: 12px;">Show this ticket at the gate</p>
      <div class="qr-code">${ticket.tokenHash?.substring(0, 16) || "N/A"}...</div>
      <p style="font-size: 12px; color: #6c757d; margin-top: 8px;">Ticket ID: #${ticket.id}</p>
    </div>
  </div>
</body>
</html>`; //NOSONAR
};

const generateErrorPage = (title, message) => {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:sans-serif;text-align:center;padding:48px;background:#f8f9fa;}</style></head> //NOSONAR
    <body><h1>${title}</h1><p style="color:#6c757d;font-size:16px;">${message}</p>
    <p style="margin-top:32px;"><a href="/" style="color:#0d6efd;">Return to event</a></p></body></html>`;
};

module.exports = { webPassController, generatePassPage };
