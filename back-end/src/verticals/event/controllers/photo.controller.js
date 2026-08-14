"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");
const walletPassService = require("./walletPass.service");

const ATTENDEE_PHOTOS_DIR = path.join(__dirname, "../../../uploads/event-photos");

if (!fs.existsSync(ATTENDEE_PHOTOS_DIR)) {
  fs.mkdirSync(ATTENDEE_PHOTOS_DIR, { recursive: true });
}

const photoController = {};

photoController.uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "NO_FILE", message: "No file uploaded" });
  }

  const ext = path.extname(req.file.originalname) || ".jpg";
  const photoRef = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const filename = `${photoRef}${ext}`;
  const filepath = path.join(ATTENDEE_PHOTOS_DIR, filename);

  fs.writeFileSync(filepath, req.file.buffer);

  return res.status(200).json({
    success: true,
    photoRef,
    url: `/uploads/event-photos/${filename}`,
  });
};

photoController.getPhoto = async (req, res) => {
  const { photoRef } = req.params;
  if (!photoRef || !/^[a-f0-9]{64}$/.test(photoRef)) {
    return res.status(400).json({ success: false, error: "INVALID_PHOTO_REF", message: "Invalid photo reference" });
  }

  const ext = req.query.ext || "jpg";
  const normalizedExt = String(ext).split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png"].includes(normalizedExt)) {
    return res.status(400).json({ success: false, error: "INVALID_EXT", message: "Invalid image extension" });
  }
  const filename = `${photoRef}.${normalizedExt}`;
  const filepath = path.join(ATTENDEE_PHOTOS_DIR, filename);

  if (!fs.existsSync(filepath)) {
    const jpgPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.jpg`);
    const pngPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.png`);
    if (fs.existsSync(jpgPath)) {
      return res.sendFile(jpgPath);
    }
    if (fs.existsSync(pngPath)) {
      return res.sendFile(pngPath);
    }
    return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Photo not found" });
  }

  res.type(`image/${normalizedExt}`);
  res.sendFile(filepath);
};

module.exports = photoController;
