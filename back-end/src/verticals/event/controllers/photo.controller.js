"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");

const ATTENDEE_PHOTOS_DIR = path.join(__dirname, "../../../uploads/event-photos");
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const ATTENDEE_PHOTOS_BASE_DIR = path.resolve(ATTENDEE_PHOTOS_DIR);

const isPathSafe = (filePath) => {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(ATTENDEE_PHOTOS_BASE_DIR + path.sep);
};

fs.mkdirSync(ATTENDEE_PHOTOS_DIR, { recursive: true });

const photoController = {};

photoController.uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "NO_FILE", message: "No file uploaded" });
  }

  const ext = path.extname(req.file.originalname).slice(1).toLowerCase() || "jpg";
  const safeExt = ALLOWED_EXTS.has(ext) ? ext : "jpg";
  const photoRef = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const filename = `${photoRef}.${safeExt}`;
  const filepath = path.resolve(ATTENDEE_PHOTOS_DIR, filename);
  if (!isPathSafe(filepath)) {
    return res.status(400).json({ success: false, error: "INVALID_PATH", message: "Invalid photo path" });
  }

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
  const safeExt = ALLOWED_EXTS.has(ext.toLowerCase()) ? ext.toLowerCase() : "jpg";
  const filename = `${photoRef}.${safeExt}`;
  const filepath = path.join(ATTENDEE_PHOTOS_DIR, filename);
  const resolvedPath = path.resolve(filepath);
  if (!isPathSafe(resolvedPath)) {
    return res.status(400).json({ success: false, error: "INVALID_PATH", message: "Invalid photo path" });
  }

  try {
    res.type(`image/${safeExt}`);
    return res.sendFile(resolvedPath);
  } catch {
    const jpgResolved = path.resolve(ATTENDEE_PHOTOS_DIR, `${photoRef}.jpg`);
    const pngResolved = path.resolve(ATTENDEE_PHOTOS_DIR, `${photoRef}.png`);
    if (isPathSafe(jpgResolved)) {
      res.type("image/jpeg");
      return res.sendFile(jpgResolved);
    }
    if (isPathSafe(pngResolved)) {
      res.type("image/png");
      return res.sendFile(pngResolved);
    }
    return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Photo not found" });
  }
};

module.exports = photoController;
