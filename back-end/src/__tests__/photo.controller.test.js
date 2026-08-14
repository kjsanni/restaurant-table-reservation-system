"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const photoControllerPath = "../verticals/event/controllers/photo.controller";
const uploadsDir = path.join(__dirname, "../verticals/event/controllers", "../../../uploads/event-photos");

describe("photo.controller", () => {
  let photoController;

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.sendFile = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("uploadPhoto", () => {
    const validSha256 = crypto.createHash("sha256").update("test-data").digest("hex");

    it("returns 400 when no file is uploaded", async () => {
      photoController = require(photoControllerPath);
      const req = {};
      const res = mockRes();
      await photoController.uploadPhoto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "NO_FILE",
        message: "No file uploaded",
      });
    });

    it("writes file and returns success with photoRef and url", async () => {
      const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      const existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);

      photoController = require(photoControllerPath);
      const req = { file: { buffer: Buffer.from("test-data"), originalname: "photo.png" } };
      const res = mockRes();
      await photoController.uploadPhoto(req, res);

      expect(existsSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
      const writtenPath = writeFileSyncSpy.mock.calls[0][0];
      expect(writtenPath).toContain(validSha256);
      expect(writtenPath).toMatch(/\.png$/);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        photoRef: validSha256,
        url: `/uploads/event-photos/${validSha256}.png`,
      });
    });

    it("defaults extension to .jpg when originalname has no extension", async () => {
      jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      jest.spyOn(fs, "existsSync").mockReturnValue(true);

      photoController = require(photoControllerPath);
      const req = { file: { buffer: Buffer.from("test-data"), originalname: "" } };
      const res = mockRes();
      await photoController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const callArg = res.json.mock.calls[0][0];
      expect(callArg.url).toMatch(/\.jpg$/);
    });
  });

  describe("getPhoto", () => {
    const validSha256 = crypto.createHash("sha256").update("test-image-data").digest("hex");

    const mockFileExistence = (files) => {
      const existsSpy = jest.spyOn(fs, "existsSync");
      existsSpy.mockImplementation((p) => {
        const filename = path.basename(p);
        return files.includes(filename);
      });
      return existsSpy;
    };

    it("returns 400 when photoRef is missing", async () => {
      photoController = require(photoControllerPath);
      const req = { params: {}, query: {} };
      const res = mockRes();
      await photoController.getPhoto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "INVALID_PHOTO_REF",
        message: "Invalid photo reference",
      });
    });

    it("returns 400 when photoRef is not a valid SHA-256 hash", async () => {
      photoController = require(photoControllerPath);
      const req = { params: { photoRef: "invalid" }, query: {} };
      const res = mockRes();
      await photoController.getPhoto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "INVALID_PHOTO_REF",
        message: "Invalid photo reference",
      });
    });

    it("returns 400 for invalid extension", async () => {
      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "exe" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "INVALID_EXT",
        message: "Invalid image extension",
      });
    });

    it("returns 404 when photo is not found", async () => {
      mockFileExistence([]);
      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "jpg" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "NOT_FOUND",
        message: "Photo not found",
      });
    });

    it("serves file directly when exact filename exists", async () => {
      const filename = `${validSha256}.jpg`;
      const existsSpy = mockFileExistence([filename]);

      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "jpg" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);

      expect(res.sendFile).toHaveBeenCalledWith(filename, { root: uploadsDir });
    });

    it("falls back to .jpg when requested .png does not exist but jpg does", async () => {
      mockFileExistence([`${validSha256}.jpg`]);

      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "png" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);

      expect(res.sendFile).toHaveBeenCalledWith(`${validSha256}.jpg`, { root: uploadsDir });
    });

    it("falls back to .png when requested .jpg does not exist but png does", async () => {
      mockFileExistence([`${validSha256}.png`]);

      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "jpg" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);

      expect(res.sendFile).toHaveBeenCalledWith(`${validSha256}.png`, { root: uploadsDir });
    });

    it("normalizes 'jpeg' extension to 'jpg'", async () => {
      const filename = `${validSha256}.jpg`;
      mockFileExistence([filename]);

      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "jpeg" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);

      expect(res.sendFile).toHaveBeenCalledWith(filename, { root: uploadsDir });
    });

    it("returns 404 when neither jpg nor png fallback exists", async () => {
      mockFileExistence([]);

      photoController = require(photoControllerPath);
      const req = { params: { photoRef: validSha256 }, query: { ext: "jpg" } };
      const res = mockRes();
      await photoController.getPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "NOT_FOUND",
        message: "Photo not found",
      });
    });
  });
});
