"use strict";

const axios = require("axios");
const { cache } = require("../utils/cache");

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "RTRS/1.0 (contact@vibespot.tech)";
const GEOCODE_CACHE_TTL = 60 * 60 * 24;

const GHANA_REGIONS = [
  { name: "Greater Accra", minLat: 5.4, maxLat: 5.8, minLng: -0.3, maxLng: 0.1 },
  { name: "Ashanti", minLat: 6.0, maxLat: 7.5, minLng: -2.1, maxLng: -1.0 },
  { name: "Central", minLat: 5.0, maxLat: 5.8, minLng: -1.8, maxLng: -0.5 },
  { name: "Western", minLat: 4.7, maxLat: 6.3, minLng: -2.9, maxLng: -1.5 },
  { name: "Eastern", minLat: 5.7, maxLat: 7.2, minLng: -1.0, maxLng: 0.1 },
  { name: "Volta", minLat: 5.6, maxLat: 8.3, minLng: 0.0, maxLng: 1.4 },
  { name: "Bono", minLat: 7.0, maxLat: 8.5, minLng: -2.9, maxLng: -1.5 },
  { name: "Bono East", minLat: 7.2, maxLat: 8.6, minLng: -2.2, maxLng: -1.0 },
  { name: "Ahafo", minLat: 6.4, maxLat: 7.6, minLng: -2.7, maxLng: -1.8 },
  { name: "Northern", minLat: 8.0, maxLat: 10.1, minLng: -1.3, maxLng: 0.6 },
  { name: "Savannah", minLat: 8.5, maxLat: 11.0, minLng: -2.5, maxLng: 0.0 },
  { name: "North East", minLat: 9.5, maxLat: 11.2, minLng: -1.6, maxLng: 0.3 },
  { name: "Upper East", minLat: 10.2, maxLat: 11.2, minLng: -1.7, maxLng: -0.2 },
  { name: "Upper West", minLat: 9.4, maxLat: 11.0, minLng: -2.9, maxLng: -1.5 },
  { name: "Oti", minLat: 6.5, maxLat: 8.5, minLng: -0.3, maxLng: 0.9 },
  { name: "Western North", minLat: 5.4, maxLat: 6.8, minLng: -3.0, maxLng: -2.0 },
];

const resolveRegionFromCoords = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  const match = GHANA_REGIONS.find(
    (r) =>
      latitude >= r.minLat &&
      latitude <= r.maxLat &&
      longitude >= r.minLng &&
      longitude <= r.maxLng
  );
  return match ? match.name : null;
};

const reverseGeocode = async (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw { status: 400, message: "Invalid coordinates for reverse geocoding." };
  }

  const cacheKey = `geocode:rev:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: { lat: latitude, lon: longitude, format: "json", addressdetails: 1 },
      headers: { "User-Agent": USER_AGENT },
      timeout: 8000,
    });
    const addr = response.data?.address || {};
    const result = {
      address: response.data?.display_name || null,
      city: addr.city || addr.town || addr.village || addr.suburb || null,
      region: addr.state || resolveRegionFromCoords(latitude, longitude),
      country: addr.country || null,
      latitude,
      longitude,
    };
    await cache.set(cacheKey, result, GEOCODE_CACHE_TTL);
    return result;
  } catch (err) {
    const region = resolveRegionFromCoords(latitude, longitude);
    return {
      address: null,
      city: null,
      region,
      country: "Ghana",
      latitude,
      longitude,
    };
  }
};

const geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;

  const trimmed = address.trim().slice(0, 200);
  const cacheKey = `geocode:fwd:${trimmed.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: { q: trimmed, format: "json", limit: 1, countrycodes: "gh" },
      headers: { "User-Agent": USER_AGENT },
      timeout: 8000,
    });
    if (!response.data || response.data.length === 0) return null;
    const place = response.data[0];
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);
    const result = {
      latitude,
      longitude,
      address: place.display_name,
      region: resolveRegionFromCoords(latitude, longitude),
    };
    await cache.set(cacheKey, result, GEOCODE_CACHE_TTL);
    return result;
  } catch (err) {
    return null;
  }
};

module.exports = {
  reverseGeocode,
  geocodeAddress,
  resolveRegionFromCoords,
  GHANA_REGIONS,
};
