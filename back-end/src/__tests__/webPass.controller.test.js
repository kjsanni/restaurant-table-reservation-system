"use strict";

jest.mock("../db/models", () => ({
  Event: { findOne: jest.fn() },
  setting: { findOne: jest.fn(), findAll: jest.fn() },
}));

jest.mock("../verticals/event/DAOs/qrCode.dao", () => ({
  hashToken: jest.fn(),
  findByTokenHash: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/passSigningRequest.dao", () => ({
  listByTenant: jest.fn(),
}));

jest.mock("../verticals/event/services/qrCode.service", () => ({
  hashToken: jest.fn(),
  verifySignature: jest.fn(),
  loadQrSecret: jest.fn(),
}));

jest.mock("../verticals/event/services/walletPass.service", () => ({
  generateArtifact: jest.fn(),
  loadTenantDesign: jest.fn(),
  signAllPlatforms: jest.fn(),
  signForPlatform: jest.fn(),
  getSupportedPlatforms: jest.fn(),
}));

jest.mock("../utils/cache", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const { webPassController } = require("../verticals/event/controllers/webPass.controller");
const db = require("../db/models");
const qrCodeDAO = require("../verticals/event/DAOs/qrCode.dao");
const qrCodeService = require("../verticals/event/services/qrCode.service");
const passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
const walletPassService = require("../verticals/event/services/walletPass.service");
const cache = require("../utils/cache");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

function createReq(overrides = {}) {
  return {
    params: {},
    query: {},
    headers: {},
    tenant: { id: 1 },
    ...overrides,
  };
}

const TEST_TOKEN = "a".repeat(64);
const TEST_HASH = "hash_" + TEST_TOKEN;
const TEST_SIG = "sig_" + TEST_TOKEN;
const TEST_SHORT_CODE = "a1b2c3d4e5f6a7b8";

const cachedTicket = JSON.stringify({
  ticketId: 1,
  tenantId: 1,
  rawToken: TEST_TOKEN,
  sig: TEST_SIG,
});

const mockQr = {
  id: 1,
  eventId: 5,
  tenantId: 1,
  attendeeName: "John",
  seat: "A1",
  tier: "VIP",
  ticketType: "General",
  tokenHash: TEST_HASH,
  expiresAt: null,
  status: "active",
  photoRef: null,
};

describe("webPass.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("viewPass — short code validation", () => {
    it("returns 400 for invalid short code format", async () => {
      const req = createReq({ params: { shortCode: "invalid-short-code" } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();
    });

    it("returns 410 for expired link (cache miss)", async () => {
      cache.get.mockResolvedValue(null);
      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(cache.get).toHaveBeenCalledWith(`event_pass:${TEST_SHORT_CODE}`);
      expect(res.status).toHaveBeenCalledWith(410);
    });

    it("returns 400 for empty short code", async () => {
      cache.get.mockResolvedValue(null);
      const req = createReq({ params: { shortCode: "" } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("viewPass — signature and ticket verification", () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(cachedTicket);
    });

    it("returns 500 when signature is missing", async () => {
      cache.get.mockResolvedValue(
        JSON.stringify({ ticketId: 1, tenantId: 1, rawToken: TEST_TOKEN, sig: null })
      );

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("returns 403 when signature verification fails", async () => {
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(false);

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(qrCodeDAO.findByTokenHash).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 404 when qrCode not found", async () => {
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(null);

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("renders pass page even when event lookup fails (graceful degradation)", async () => {
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(mockQr);
      db.Event.findOne.mockResolvedValue(null);
      passSigningRequestDAO.listByTenant.mockResolvedValue([]);

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/html");
      expect(res.send).toHaveBeenCalled();
      const html = res.send.mock.calls[0][0];
      expect(html).toContain("Event Ticket");
    });
  });

  describe("viewPass — HTML page rendering", () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(cachedTicket);
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(mockQr);
      db.Event.findOne.mockResolvedValue({
        id: 5,
        name: "Test Event",
        venue: "Test Venue",
        eventDate: "2025-12-01",
      });
    });

    it("renders pass page with wallet buttons when approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(passSigningRequestDAO.listByTenant).toHaveBeenCalledWith(1, {});
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/html");
      expect(res.send).toHaveBeenCalled();
      const html = res.send.mock.calls[0][0];
      expect(html).toContain("Add to Apple Wallet");
      expect(html).toContain("Add to Google Pay");
      expect(html).toContain("Add to Samsung Pay");
    });

    it("renders pass page without wallet buttons when not approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([]);

      const req = createReq({ params: { shortCode: TEST_SHORT_CODE } });
      const res = createRes();

      await webPassController.viewPass(req, res);

      const html = res.send.mock.calls[0][0];
      expect(html).toContain("Wallet passes are not yet available");
      expect(html).not.toContain("Add to Apple Wallet");
    });
  });

  describe("viewPass — Apple pkpass format", () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(cachedTicket);
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(mockQr);
      db.Event.findOne.mockResolvedValue({
        id: 5,
        name: "Test Event",
        venue: "Test Venue",
        eventDate: "2025-12-01",
      });
    });

    it("returns 410 for pkpass when not approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([]);

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "pkpass" },
        headers: { accept: "application/vnd.apple.pkpass" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
    });

    it("serves pkpass file when approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);
      walletPassService.generateArtifact.mockResolvedValue({
        results: {
          apple: { artifactType: "file", artifactPath: "/tmp/test.pkpass" },
          google: null,
          samsung: null,
        },
        errors: {},
        platforms: ["apple"],
      });

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "pkpass" },
        headers: { accept: "application/vnd.apple.pkpass" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(walletPassService.generateArtifact).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/vnd.apple.pkpass");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        `attachment; filename="ticket-1.pkpass"`
      );
      expect(res.sendFile).toHaveBeenCalledWith("/tmp/test.pkpass");
    });

    it("returns 500 for pkpass when generation fails", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);
      walletPassService.generateArtifact.mockResolvedValue({
        results: { apple: null },
        errors: { apple: "Signing error" },
        platforms: ["apple"],
      });

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "pkpass" },
        headers: { accept: "application/vnd.apple.pkpass" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("viewPass — Google Pay format", () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(cachedTicket);
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(mockQr);
      db.Event.findOne.mockResolvedValue({
        id: 5,
        name: "Test Event",
        venue: "Test Venue",
        eventDate: "2025-12-01",
      });
    });

    it("returns 410 for google when not approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([]);

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "google" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Google Wallet passes are not yet available for this event.",
      });
    });

    it("returns JSON deepLink for Google Pay when approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);
      walletPassService.generateArtifact.mockResolvedValue({
        results: {
          google: { artifactType: "url", artifactPath: "https://google.com/save", accessToken: "jwt-token" },
          apple: null,
          samsung: null,
        },
        errors: {},
        platforms: ["google"],
      });

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "google" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        googlePayJwt: "jwt-token",
        deepLink: "https://google.com/save",
      });
    });

    it("returns 500 for google when signing fails", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);
      walletPassService.generateArtifact.mockResolvedValue({
        results: { google: null },
        errors: { google: "Google signing error" },
        platforms: ["google"],
      });

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "google" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Could not generate Google Wallet pass.",
      });
    });
  });

  describe("viewPass — Samsung Pay format", () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(cachedTicket);
      qrCodeService.loadQrSecret.mockResolvedValue("secret");
      qrCodeService.verifySignature.mockReturnValue(true);
      qrCodeDAO.hashToken.mockReturnValue(TEST_HASH);
      qrCodeDAO.findByTokenHash.mockResolvedValue(mockQr);
      db.Event.findOne.mockResolvedValue({
        id: 5,
        name: "Test Event",
        venue: "Test Venue",
        eventDate: "2025-12-01",
      });
    });

    it("returns 410 for samsung when not approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([]);

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "samsung" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Samsung Pay passes are not yet available for this event.",
      });
    });

    it("returns JSON deepLink for Samsung Pay when approved", async () => {
      passSigningRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, eventId: 5, status: "approved", tenantId: 1 },
      ]);
      walletPassService.generateArtifact.mockResolvedValue({
        results: {
          samsung: {
            artifactType: "url",
            artifactPath: "https://samsung.com/add",
            accessToken: "samsung-token",
          },
          apple: null,
          google: null,
        },
        errors: {},
        platforms: ["samsung"],
      });

      const req = createReq({
        params: { shortCode: TEST_SHORT_CODE },
        query: { format: "samsung" },
      });
      const res = createRes();

      await webPassController.viewPass(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        deepLink: "https://samsung.com/add",
        accessToken: "samsung-token",
      });
    });
  });

  describe("generatePassPage", () => {
    it("includes event name and attendee info in HTML", () => {
      const { generatePassPage } = require("../verticals/event/controllers/webPass.controller");
      const html = generatePassPage({
        event: { name: "My Event", venue: "Venue", date: "2025-12-01" },
        attendee: {
          name: "Jane",
          seat: "B2",
          tier: "Standard",
          ticketType: "General",
        },
        ticket: { id: 1, tokenHash: "abcd1234abcd1234", expiresAt: null, status: "active" },
        shortCode: TEST_SHORT_CODE,
        baseUrl: "https://test.com",
        walletPassesEnabled: true,
      });

      expect(html).toContain("My Event");
      expect(html).toContain("Jane");
      expect(html).toContain("Seat: B2");
      expect(html).toContain("Standard Tier");
      expect(html).toContain("Add to Apple Wallet");
      expect(html).toContain("https://test.com/e/a1b2c3d4e5f6a7b8?format=pkpass");
    });
  });
});
