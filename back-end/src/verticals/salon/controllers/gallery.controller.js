"use strict";
const galleryDao = require("../DAOs/gallery.dao");

const createGalleryImageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const payload = req.body;

    const image = await galleryDao.create({
      tenantId,
      appointmentId: payload.appointmentId || null,
      url: payload.url,
      caption: payload.caption || null,
      isPublic: payload.isPublic || false,
    });

    return res.status(201).json({ success: true, image });
  } catch (err) {
    console.error("createGalleryImageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to upload gallery image" });
  }
};

const getGalleryImagesHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const result = await galleryDao.findAllForTenant(tenantId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("getGalleryImagesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load gallery" });
  }
};

const deleteGalleryImageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await galleryDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteGalleryImageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete image" });
  }
};

module.exports = {
  createGalleryImageHandler,
  getGalleryImagesHandler,
  deleteGalleryImageHandler,
};
