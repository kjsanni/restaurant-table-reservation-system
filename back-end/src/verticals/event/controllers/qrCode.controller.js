"use strict";

const qrCodeService = require("../services/qrCode.service");

const getQRCodesHandler = async (req, res) => {
  const filters = {
    limit: req.query?.limit,
    page: req.query?.page,
    pageSize: req.query?.pageSize,
  };
  const result = await qrCodeService.getQRCodes(req.params.eventId, req.tenant?.id, filters);
  res.status(200).json(result);
};

const generateQRCodeHandler = async (req, res) => {
  const qrCode = await qrCodeService.generateQRCode(req.params.eventId, req.body, req.tenant?.id);
  res.status(201).json({ success: true, item: qrCode });
};

const generateBatchQRCodesHandler = async (req, res) => {
  const { count, ...data } = req.body;
  const qrCodes = await qrCodeService.generateBatchQRCodes(
    req.params.eventId,
    parseInt(count, 10),
    data,
    req.tenant?.id
  );
  res.status(201).json({ success: true, items: qrCodes });
};

const getScannerConfigHandler = async (req, res) => {
  const config = await qrCodeService.getScannerConfig(req.tenant?.id);
  res.status(200).json({ success: true, config });
};

const checkinHandler = async (req, res) => {
  const token = req.params?.token;
  const { scannerId, latitude, longitude, signature } = req.body || {};

  if (!token || typeof token !== "string" || token.length !== 64) {
    return res.status(400).json({
      success: false,
      error: "INVALID_TOKEN",
      message: "A valid 64-character token is required",
    });
  }

  const result = await qrCodeService.checkin(
    token,
    req.tenant?.id,
    req.user?.id,
    { scannerId, latitude, longitude, signature }
  );

  if (!result.valid) {
    const statusMap = {
      INVALID_TOKEN: 404,
      ALREADY_USED: 410,
      RATE_LIMITED: 429,
      DEVICE_MISMATCH: 409,
      CONCURRENT_SCAN: 425,
      EXPIRED: 410,
      NOT_YET_VALID: 423,
      INVALID_SIGNATURE: 403,
    };
    const status = statusMap[result.error] || 400;
    return res.status(status).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  res.status(200).json({
    success: true,
    admitted: result.admitted,
    attendeeName: result.item.attendeeName,
    seat: result.item.seat,
    tier: result.item.tier,
    checkedInAt: result.item.checkedInAt,
    usedCount: result.item.usedCount,
    maxUses: result.item.maxUses,
  });
};

const verifyTokenHandler = async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string" || token.length !== 64) {
    return res.status(400).json({
      success: false,
      message: "A valid 64-character token is required",
    });
  }

  const record = await qrCodeService.verifyToken(token, req.tenant?.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Token not found" });
  }

  res.status(200).json({
    success: true,
    item: {
      attendeeName: record.attendeeName,
      seat: record.seat,
      tier: record.tier,
      ticketType: record.ticketType,
      status: record.status,
      usedCount: record.usedCount,
      maxUses: record.maxUses,
      expiresAt: record.expiresAt,
    },
  });
};

module.exports = {
  getQRCodesHandler,
  generateQRCodeHandler,
  generateBatchQRCodesHandler,
  getScannerConfigHandler,
  checkinHandler,
  verifyTokenHandler,
};
