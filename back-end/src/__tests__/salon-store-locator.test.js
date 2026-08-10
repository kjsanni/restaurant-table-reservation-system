"use strict";

jest.mock("../services/whatsapp.service");
jest.mock("../verticals/salon/DAOs/location.dao");
jest.mock("../utils/cache");

const storeLocatorService = require("../verticals/salon/services/storeLocator.service");
const whatsappService = require("../services/whatsapp.service");
const locationDao = require("../verticals/salon/DAOs/location.dao");
const { cache } = require("../utils/cache");

describe("storeLocator.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
  });

  describe("handleStoreLocationQuery", () => {
    it("sends text when no locations exist", async () => {
      locationDao.findAll.mockResolvedValue([]);

      await storeLocatorService.handleStoreLocationQuery("+233241234567", 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "We don't have any locations listed yet. Please contact us directly.",
        1
      );
      expect(whatsappService.sendLocationMessage).not.toHaveBeenCalled();
    });

    it("sends pin directly when single location exists", async () => {
      locationDao.findAll.mockResolvedValue([
        { id: 1, name: "Main Salon", latitude: 5.6037, longitude: -0.187, address: "Accra Mall" },
      ]);

      await storeLocatorService.handleStoreLocationQuery("+233241234567", 1);

      expect(whatsappService.sendLocationMessage).toHaveBeenCalledWith(
        "+233241234567",
        {
          latitude: 5.6037,
          longitude: -0.187,
          name: "Main Salon",
          address: "Accra Mall",
        },
        1
      );
    });

    it("asks for location when multiple locations exist", async () => {
      locationDao.findAll.mockResolvedValue([
        { id: 1, name: "Branch A", latitude: 5.6037, longitude: -0.187 },
        { id: 2, name: "Branch B", latitude: 5.61, longitude: -0.19 },
      ]);

      await storeLocatorService.handleStoreLocationQuery("+233241234567", 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "We have multiple locations. Please share your location (attachment → Location) so we can find the nearest one.",
        1
      );
      expect(cache.set).toHaveBeenCalledWith(
        "whatsapp:session:+233241234567",
        { state: "store_locator_awaiting", tenantId: 1 },
        86400
      );
    });

    it("falls back to text when single location has no coordinates", async () => {
      locationDao.findAll.mockResolvedValue([
        { id: 1, name: "Main Salon", address: "Accra Mall", city: "Accra", latitude: null, longitude: null },
      ]);

      await storeLocatorService.handleStoreLocationQuery("+233241234567", 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "Main Salon\nMain Salon, Accra Mall, Accra",
        1
      );
      expect(whatsappService.sendLocationMessage).not.toHaveBeenCalled();
    });
  });

  describe("sendStoreLocation", () => {
    it("sends location pin when coordinates exist", async () => {
      await storeLocatorService.sendStoreLocation("+233241234567", {
        id: 1,
        name: "Main Salon",
        latitude: 5.6037,
        longitude: -0.187,
        address: "Accra Mall",
        city: "Accra",
        region: "Greater Accra",
      }, 1);

      expect(whatsappService.sendLocationMessage).toHaveBeenCalledWith(
        "+233241234567",
        {
          latitude: 5.6037,
          longitude: -0.187,
          name: "Main Salon",
          address: "Accra Mall",
        },
        1
      );
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "Accra Mall, Accra, Greater Accra",
        1
      );
    });

    it("sends text-only when coordinates are missing", async () => {
      await storeLocatorService.sendStoreLocation("+233241234567", {
        id: 1,
        name: "Main Salon",
        address: "Accra Mall",
        city: "Accra",
        latitude: null,
        longitude: null,
      }, 1);

      expect(whatsappService.sendLocationMessage).not.toHaveBeenCalled();
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "Main Salon\nMain Salon, Accra Mall, Accra",
        1
      );
    });
  });

  describe("handleStoreLocatorLocation", () => {
    it("finds and sends nearest store", async () => {
      cache.get.mockResolvedValue({ state: "store_locator_awaiting", tenantId: 1 });
      locationDao.findAllWithCoordinates.mockResolvedValue([
        { id: 1, name: "Branch A", latitude: 5.6037, longitude: -0.187 },
        { id: 2, name: "Branch B", latitude: 5.61, longitude: -0.19 },
      ]);

      await storeLocatorService.handleStoreLocatorLocation("+233241234567", {
        latitude: 5.604,
        longitude: -0.188,
      }, 1);

      expect(whatsappService.sendLocationMessage).toHaveBeenCalledWith(
        "+233241234567",
        {
          latitude: 5.6037,
          longitude: -0.187,
          name: "Branch A",
        },
        1
      );
      expect(cache.set).toHaveBeenCalledWith(
        "whatsapp:session:+233241234567",
        { state: "idle", tenantId: 1 },
        86400
      );
    });

    it("returns false when session is not store_locator_awaiting", async () => {
      cache.get.mockResolvedValue({ state: "idle", tenantId: 1 });

      const result = await storeLocatorService.handleStoreLocatorLocation("+233241234567", {
        latitude: 5.604,
        longitude: -0.188,
      }, 1);

      expect(result).toBe(false);
      expect(whatsappService.sendLocationMessage).not.toHaveBeenCalled();
    });

    it("sends fallback when no locations have coordinates", async () => {
      cache.get.mockResolvedValue({ state: "store_locator_awaiting", tenantId: 1 });
      locationDao.findAllWithCoordinates.mockResolvedValue([]);

      await storeLocatorService.handleStoreLocatorLocation("+233241234567", {
        latitude: 5.604,
        longitude: -0.188,
      }, 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "We don't have any locations with coordinates yet. Please contact us directly.",
        1
      );
      expect(cache.set).toHaveBeenCalledWith(
        "whatsapp:session:+233241234567",
        { state: "idle", tenantId: 1 },
        86400
      );
    });
  });

  describe("findNearestStore", () => {
    it("returns the closest location by haversine distance", async () => {
      cache.get.mockResolvedValue({ state: "store_locator_awaiting", tenantId: 1 });
      locationDao.findAllWithCoordinates.mockResolvedValue([
        { id: 1, name: "Near", latitude: 5.6037, longitude: -0.187 },
        { id: 2, name: "Far", latitude: 6.6884, longitude: -1.6244 },
      ]);

      await storeLocatorService.handleStoreLocatorLocation("+233241234567", {
        latitude: 5.604,
        longitude: -0.188,
      }, 1);

      expect(whatsappService.sendLocationMessage).toHaveBeenCalledWith(
        "+233241234567",
        expect.objectContaining({ name: "Near" }),
        1
      );
    });
  });
});
