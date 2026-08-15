"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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
  const resolved = path.resolve(filepath);
  const resolvedBase = path.resolve(ATTENDEE_PHOTOS_DIR);
  if (!resolved.startsWith(resolvedBase + path.sep)) {
    return res.status(400).json({ success: false, error: "INVALID_PATH", message: "Invalid file path" });
  }

  fs.writeFileSync(resolved, req.file.buffer);

  return res.status(200).json({
    success: true,
    photoRef,
    url: `/uploads/event-photos/${filename}`,
  });
};

photoController.getPhoto = async (req, res) => {
  const { photoRef } = req.params;
  if (!photoRef || !/^[a-f0-9]{64}$/i.test(photoRef)) {
    return res.status(400).json({ success: false, error: "INVALID_PHOTO_REF", message: "Invalid photo reference" });
  }

  const ext = req.query.ext || "jpg";
  const normalizedExt = String(ext).split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png"].includes(normalizedExt)) {
    return res.status(400).json({ success: false, error: "INVALID_EXT", message: "Invalid image extension" });
  }

  const filename = `${photoRef}.${normalizedExt}`;

  if (!fs.existsSync(path.join(ATTENDEE_PHOTOS_DIR, filename))) { // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - photoRef validated as SHA-256 hex, ext whitelisted; nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal - path validated above
    const jpgPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.jpg`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - photoRef validated as SHA-256 hex; nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal - path under ATTENDEE_PHOTOS_DIR
    const pngPath = path.join(ATTENDEE_PHOTOS_DIR, `${photoRef}.png`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - photoRef validated as SHA-256 hex; nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal - path under ATTENDEE_PHOTOS_DIR
    if (fs.existsSync(jpgPath)) {
      return res.sendFile(`${photoRef}.jpg`, { root: ATTENDEE_PHOTOS_DIR });
    }
    if (fs.existsSync(pngPath)) {
      return res.sendFile(`${photoRef}.png`, { root: ATTENDEE_PHOTOS_DIR });
    }
    return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Photo not found" });
  }

  res.sendFile(filename, { root: ATTENDEE_PHOTOS_DIR });
};

module.exports = photoController;
