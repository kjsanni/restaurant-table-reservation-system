"use strict";

jest.mock("../verticals/salon/DAOs/gallery.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const galleryController = require("../verticals/salon/controllers/gallery.controller");

describe("gallery.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const json = jest.fn();
    const status = jest.fn(function () {
      return { json: json };
    });
    return {
      res: { status: status, json: json },
      expectJson: function (expected) {
        expect(json).toHaveBeenCalledWith(expected);
      },
    };
  }

  it("getGalleryImages returns data for tenant", async () => {
    require("../verticals/salon/DAOs/gallery.dao").findAllForTenant.mockResolvedValue({
      total: 1,
      data: [{ id: 1, url: "https://example.com/a.jpg", isPublic: true }],
    });

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await galleryController.getGalleryImagesHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/gallery.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      total: 1,
      data: [{ id: 1, url: "https://example.com/a.jpg", isPublic: true }],
    });
  });

  it("createGalleryImage returns 201", async () => {
    require("../verticals/salon/DAOs/gallery.dao").create.mockResolvedValue({
      id: 1,
      url: "https://example.com/b.jpg",
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { url: "https://example.com/b.jpg", isPublic: true },
    };

    await galleryController.createGalleryImageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      image: { id: 1, url: "https://example.com/b.jpg" },
    });
  });

  it("deleteGalleryImage returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/gallery.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await galleryController.deleteGalleryImageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Image not found" });
  });
});
