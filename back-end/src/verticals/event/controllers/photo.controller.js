"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("../services/qrCode.service");
const walletPassService = require("../services/walletPass.service");

const ATTENDEE_PHOTOS_DIR = path.join(__dirname, "../../../uploads/event-photos");
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

if (!fs.existsSync(ATTENDEE_PHOTOS_DIR)) {
  fs.mkdirSync(ATTENDEE_PHOTOS_DIR, { recursive: true });
}

const photoController = {};

photoController.uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "NO_FILE", message: "No file uploaded" });
  }

  const ext = path.extname(req.file.originalname).slice(1).toLowerCase() || "jpg";
  const photoRef = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const filename = `${photoRef}.${ALLOWED_EXTS.has(ext) ? ext : "jpg"}`;
  const filepath = path.join(ATTENDEE_PHOTOS_DIR, filename);

  fs.writeFileSync(filepath, req.file.buffer); // nosemgrep: express-path-join-resolve-traversal - filename is constructed from validated photoRef and ALLOWED_EXTS

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
  const safeExt = ALLOWED_EXTS.has(ext.toLowerCase()) ? ext.toLowerCase() : "jpg";
  const filename = `${photoRef}.${safeExt}`;
  const filepath = path.join(ATTENDEE_PHOTOS_DIR, filename);
  const resolvedPath = path.resolve(filepath); // nosemgrep: express-path-join-resolve-traversal - photoRef validated by regex, safeExt from allowlist
  if (!resolvedPath.startsWith(path.resolve(ATTENDEE_PHOTOS_DIR))) { // nosemgrep: express-path-join-resolve-traversal - containment check present
    return res.status(400).json({ success: false, error: "INVALID_PATH", message: "Invalid photo path" });
  }

  if (!fs.existsSync(resolvedPath)) { // nosemgrep: express-path-join-resolve-traversal - path resolved and validated above
    const jpgPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.jpg`); // nosemgrep: express-path-join-resolve-traversal - photoRef validated by regex
    const pngPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.png`); // nosemgrep: express-path-join-resolve-traversal - photoRef validated by regex
    if (fs.existsSync(jpgPath)) {
      return res.sendFile(jpgPath); // nosemgrep: express-res-sendfile - path constructed from validated photoRef
    }
    if (fs.existsSync(pngPath)) {
      return res.sendFile(pngPath); // nosemgrep: express-res-sendfile - path constructed from validated photoRef
    }
    return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Photo not found" });
  }

  res.type(`image/${safeExt}`);
  res.sendFile(resolvedPath); // nosemgrep: express-res-sendfile - path resolved and containment-checked above
};

module.exports = photoController;
