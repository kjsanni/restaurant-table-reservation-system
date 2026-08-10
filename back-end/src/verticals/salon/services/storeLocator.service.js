"use strict";

const locationDao = require("../DAOs/location.dao");
const whatsappService = require("../../../services/whatsapp.service");
const { cache } = require("../../../utils/cache");

const SESSION_PREFIX = "whatsapp:session:";
const SESSION_TTL = 60 * 60 * 24;

const getSession = async (phone) => {
  const key = SESSION_PREFIX + phone;
  const data = await cache.get(key);
  return data || { state: "idle", tenantId: null };
};

const setSession = async (phone, session) => {
  const key = SESSION_PREFIX + phone;
  await cache.set(key, session, SESSION_TTL);
};

const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findNearestStore = (customerLat, customerLng, locations) => {
  return locations
    .map((loc) => ({
      ...loc,
      distanceKm: haversine(customerLat, customerLng, loc.latitude, loc.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
};

const storeLocatorService = {
  async handleStoreLocationQuery(phone, tenantId) {
    const locations = await locationDao.findAll(tenantId);

    if (locations.length === 0) {
      await whatsappService.sendWhatsAppText(
        phone,
        "We don't have any locations listed yet. Please contact us directly.",
        tenantId
      );
      return;
    }

    if (locations.length === 1) {
      const loc = locations[0];
      await this.sendStoreLocation(phone, loc, tenantId);
      return;
    }

    await setSession(phone, { state: "store_locator_awaiting", tenantId });
    await whatsappService.sendWhatsAppText(
      phone,
      "We have multiple locations. Please share your location (attachment → Location) so we can find the nearest one.",
      tenantId
    );
  },

  async sendStoreLocation(phone, location, tenantId) {
    if (!location.latitude || !location.longitude) {
      const address = [location.name, location.address, location.city].filter(Boolean).join(", ");
      await whatsappService.sendWhatsAppText(
        phone,
        `${location.name}\n${address || "Address not available"}`,
        tenantId
      );
      return;
    }

    await whatsappService.sendLocationMessage(phone, {
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      name: location.name,
      address: location.address || undefined,
    }, tenantId);

    const address = [location.address, location.city, location.region].filter(Boolean).join(", ");
    if (address) {
      await whatsappService.sendWhatsAppText(phone, address, tenantId);
    }
  },

  async handleStoreLocatorLocation(phone, location, tenantId) {
    const session = await getSession(phone);
    if (session.state !== "store_locator_awaiting") {
      return false;
    }

    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);
    const locations = await locationDao.findAllWithCoordinates(tenantId);

    if (!locations.length) {
      await whatsappService.sendWhatsAppText(
        phone,
        "We don't have any locations with coordinates yet. Please contact us directly.",
        tenantId
      );
      await setSession(phone, { state: "idle", tenantId });
      return true;
    }

    const nearest = findNearestStore(lat, lng, locations);
    await this.sendStoreLocation(phone, nearest, tenantId);
    await setSession(phone, { state: "idle", tenantId });
    return true;
  },
};

module.exports = storeLocatorService;
