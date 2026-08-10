"use strict";

jest.mock("../verticals/salon/DAOs/location.dao");
jest.mock("../services/geocoding.service");

const locationService = require("../verticals/salon/services/location.service");
const locationDao = require("../verticals/salon/DAOs/location.dao");
const geocodingService = require("../services/geocoding.service");

describe("location.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("geocodes when address is present and coords are missing", async () => {
      geocodingService.geocodeAddress.mockResolvedValue({
        latitude: 5.6037,
        longitude: -0.187,
      });

      locationDao.create.mockResolvedValue({
        id: 1,
        name: "Branch",
        latitude: 5.6037,
        longitude: -0.187,
      });

      const result = await locationService.create(
        { name: "Branch", address: "Accra Mall" },
        1
      );

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith("Accra Mall");
      expect(locationDao.create).toHaveBeenCalledWith(
        { name: "Branch", address: "Accra Mall", latitude: 5.6037, longitude: -0.187 },
        1
      );
      expect(result.latitude).toBe(5.6037);
    });

    it("skips geocoding when coords are already present", async () => {
      locationDao.create.mockResolvedValue({
        id: 1,
        name: "Branch",
        latitude: 5.6037,
        longitude: -0.187,
      });

      await locationService.create(
        { name: "Branch", latitude: 5.6037, longitude: -0.187 },
        1
      );

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
      expect(locationDao.create).toHaveBeenCalledWith(
        { name: "Branch", latitude: 5.6037, longitude: -0.187 },
        1
      );
    });

    it("skips geocoding when address is missing", async () => {
      locationDao.create.mockResolvedValue({
        id: 1,
        name: "Branch",
      });

      await locationService.create({ name: "Branch" }, 1);

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
      expect(locationDao.create).toHaveBeenCalledWith({ name: "Branch" }, 1);
    });

    it("leaves coords NULL when geocoding fails", async () => {
      geocodingService.geocodeAddress.mockResolvedValue(null);

      locationDao.create.mockResolvedValue({
        id: 1,
        name: "Branch",
      });

      const result = await locationService.create(
        { name: "Branch", address: "Unknown Place" },
        1
      );

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith("Unknown Place");
      expect(locationDao.create).toHaveBeenCalledWith({ name: "Branch", address: "Unknown Place" }, 1);
      expect(result.latitude).toBeUndefined();
    });
  });

  describe("update", () => {
    it("geocodes when address is present and coords are missing", async () => {
      locationDao.findById.mockResolvedValue({
        id: 1,
        name: "Branch",
        address: "Old Address",
        latitude: null,
        longitude: null,
      });

      geocodingService.geocodeAddress.mockResolvedValue({
        latitude: 5.6037,
        longitude: -0.187,
      });

      locationDao.update.mockResolvedValue({
        id: 1,
        name: "Branch",
        address: "New Address",
        latitude: 5.6037,
        longitude: -0.187,
      });

      const result = await locationService.update(1, 1, {
        name: "Branch",
        address: "New Address",
      });

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith("New Address");
      expect(locationDao.update).toHaveBeenCalledWith(1, 1, {
        name: "Branch",
        address: "New Address",
        latitude: 5.6037,
        longitude: -0.187,
      });
      expect(result.latitude).toBe(5.6037);
    });

    it("geocodes using current address when update has no address", async () => {
      locationDao.findById.mockResolvedValue({
        id: 1,
        name: "Branch",
        address: "Accra Mall",
        latitude: null,
        longitude: null,
      });

      geocodingService.geocodeAddress.mockResolvedValue({
        latitude: 5.6037,
        longitude: -0.187,
      });

      locationDao.update.mockResolvedValue({
        id: 1,
        name: "Branch",
        latitude: 5.6037,
        longitude: -0.187,
      });

      await locationService.update(1, 1, { name: "Branch" });

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith("Accra Mall");
    });

    it("skips geocoding when coords are already present in update", async () => {
      locationDao.findById.mockResolvedValue({
        id: 1,
        name: "Branch",
        latitude: null,
        longitude: null,
      });

      locationDao.update.mockResolvedValue({
        id: 1,
        name: "Branch",
        latitude: 5.6037,
        longitude: -0.187,
      });

      await locationService.update(1, 1, {
        name: "Branch",
        latitude: 5.6037,
        longitude: -0.187,
      });

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
    });

    it("returns null when location not found", async () => {
      locationDao.findById.mockResolvedValue(null);

      const result = await locationService.update(999, 1, { name: "X" });

      expect(result).toBeNull();
      expect(locationDao.update).not.toHaveBeenCalled();
    });

    it("leaves coords NULL when geocoding throws", async () => {
      locationDao.findById.mockResolvedValue({
        id: 1,
        name: "Branch",
        address: "Accra Mall",
        latitude: null,
        longitude: null,
      });

      geocodingService.geocodeAddress.mockRejectedValue(new Error("Network error"));

      locationDao.update.mockResolvedValue({
        id: 1,
        name: "Branch",
        address: "Accra Mall",
      });

      const result = await locationService.update(1, 1, { name: "Branch" });

      expect(geocodingService.geocodeAddress).toHaveBeenCalled();
      expect(locationDao.update).toHaveBeenCalledWith(1, 1, { name: "Branch" });
      expect(result.latitude).toBeUndefined();
    });
  });

  describe("pass-through methods", () => {
    it("findAll delegates to DAO", async () => {
      locationDao.findAll.mockResolvedValue([{ id: 1 }]);
      const result = await locationService.findAll(1);
      expect(locationDao.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual([{ id: 1 }]);
    });

    it("findById delegates to DAO", async () => {
      locationDao.findById.mockResolvedValue({ id: 1 });
      const result = await locationService.findById(1, 1);
      expect(locationDao.findById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ id: 1 });
    });

    it("delete delegates to DAO", async () => {
      locationDao.delete.mockResolvedValue(true);
      const result = await locationService.delete(1, 1);
      expect(locationDao.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });
});
