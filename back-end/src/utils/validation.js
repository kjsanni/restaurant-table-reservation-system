"use strict";

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return false;
  const dot = trimmed.lastIndexOf(".");
  if (dot < at + 2 || dot >= trimmed.length - 1) return false;
  return true;
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    return digits.slice(1);
  }
  return digits;
};

const isValidPhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  if (normalized.startsWith("233") && normalized.length === 12) return true;
  if (normalized.length === 9 && /^\d{9}$/.test(normalized)) return true;
  if (/^\d{10,15}$/.test(normalized)) return true;
  return false;
};

const formatPhoneNumber = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  if (normalized.startsWith("233") && normalized.length === 12) {
    return normalized;
  }
  if (normalized.startsWith("0") && normalized.length === 10) {
    return `233${normalized.slice(1)}`;
  }
  if (normalized.length === 9 && /^\d{9}$/.test(normalized)) {
    return `233${normalized}`;
  }
  if (/^\d{10,15}$/.test(normalized)) {
    return normalized;
  }
  return null;
};

const isPositiveInteger = (value) => {
  if (typeof value !== "number") return false;
  const num = value;
  return Number.isInteger(num) && num > 0;
};

const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

const required = (fields, body) => {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
};

const parsePagination = (query) => {
  const page = query?.page ? parseInt(query.page, 10) : undefined;
  const pageSize = query?.pageSize ? parseInt(query.pageSize, 10) : undefined;
  if (page !== undefined && (isNaN(page) || page < 1)) {
    return { valid: false, error: "page must be a positive integer" };
  }
  if (pageSize !== undefined && (isNaN(pageSize) || pageSize < 1)) {
    return { valid: false, error: "pageSize must be a positive integer" };
  }
  const offset =
    page !== undefined && pageSize !== undefined
      ? (page - 1) * pageSize
      : undefined;
  return { valid: true, page, pageSize, offset };
};

const pickAllowedFields = (allowed, body) => {
  const picked = {};
  for (const key of allowed) {
    if (body && Object.prototype.hasOwnProperty.call(body, key)) {
      picked[key] = body[key];
    }
  }
  return picked;
};

const isInEnum = (value, allowed) => {
  return allowed.includes(value);
};

module.exports = {
  isValidEmail,
  normalizePhone,
  isValidPhone,
  formatPhoneNumber,
  isPositiveInteger,
  isNonNegativeNumber,
  required,
  parsePagination,
  pickAllowedFields,
  isInEnum,
};
