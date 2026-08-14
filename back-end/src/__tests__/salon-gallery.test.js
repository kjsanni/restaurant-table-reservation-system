"use strict";

jest.mock("../verticals/salon/DAOs/gallery.dao");

const galleryController = require("../verticals/salon/controllers/gallery.controller");

describe("gallery.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createGalleryImage returns 201 with new image", async () => {
    require("../verticals/salon/DAOs/gallery.dao").create.mockResolvedValue({
      id: 1,
      url: "https://example.com/img.jpg",
      caption: "Test",
      isPublic: true,
    });

    const req = {
      tenant: { id: 1 },
      body: { url: "https://example.com/img.jpg", caption: "Test", isPublic: true },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.createGalleryImageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      image: { id: 1, url: "https://example.com/img.jpg", caption: "Test", isPublic: true },
    });
  });

  it("getGalleryImages returns 200 with tenant-scoped results", async () => {
    require("../verticals/salon/DAOs/gallery.dao").findAllForTenant.mockResolvedValue({
      total: 2,
      data: [{ id: 1, url: "https://example.com/1.jpg" }],
    });

    const req = {
      tenant: { id: 1 },
      query: { limit: 10 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.getGalleryImagesHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      total: 2,
      data: [{ id: 1, url: "https://example.com/1.jpg" }],
    });
  });

  it("updateGalleryImage returns 200 with updated image", async () => {
    require("../verticals/salon/DAOs/gallery.dao").findById.mockResolvedValue({
      id: 1,
      url: "https://example.com/1.jpg",
      caption: "Old",
      isPublic: false,
    });
    require("../verticals/salon/DAOs/gallery.dao").update.mockResolvedValue({
      id: 1,
      url: "https://example.com/1.jpg",
      caption: "New",
      isPublic: true,
    });

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
      body: { caption: "New", isPublic: true },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.updateGalleryImageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      image: { id: 1, url: "https://example.com/1.jpg", caption: "New", isPublic: true },
    });
  });

  it("updateGalleryImage returns 404 when image not found", async () => {
    require("../verticals/salon/DAOs/gallery.dao").findById.mockResolvedValue(null);
    require("../verticals/salon/DAOs/gallery.dao").update.mockResolvedValue(null);

    const req = {
      tenant: { id: 1 },
      params: { id: 999 },
      body: { caption: "New" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.updateGalleryImageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Image not found" });
  });

  it("deleteGalleryImage returns 200 when deleted", async () => {
    require("../verticals/salon/DAOs/gallery.dao").delete.mockResolvedValue(true);

    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.deleteGalleryImageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("deleteGalleryImage returns 404 when image not found", async () => {
    require("../verticals/salon/DAOs/gallery.dao").delete.mockResolvedValue(false);

    const req = {
      tenant: { id: 1 },
      params: { id: 999 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await galleryController.deleteGalleryImageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Image not found" });
  });
});
