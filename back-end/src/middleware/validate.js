"use strict";

const validation = require("../utils/validation");

const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.required) {
      const result = validation.required(schema.required, req.body);
      if (!result.valid) {
        for (const field of result.missing) {
          errors.push({ field, message: `${field} is required` });
        }
      }
    }

    if (schema.email) {
      const fields = Array.isArray(schema.email) ? schema.email : [schema.email];
      for (const field of fields) {
        const value = req.body?.[field];
        if (value && !validation.isValidEmail(value)) {
          errors.push({ field, message: `${field} must be a valid email address` });
        }
      }
    }

    if (schema.phone) {
      const fields = Array.isArray(schema.phone) ? schema.phone : [schema.phone];
      for (const field of fields) {
        const value = req.body?.[field];
        if (value && !validation.isValidPhone(value)) {
          errors.push({ field, message: `${field} must be a valid phone number` });
        }
      }
    }

    if (schema.positiveInteger) {
      const fields = Array.isArray(schema.positiveInteger) ? schema.positiveInteger : [schema.positiveInteger];
      for (const field of fields) {
        const value = req.body?.[field];
        if (value !== undefined && value !== null && !validation.isPositiveInteger(value)) {
          errors.push({ field, message: `${field} must be a positive integer` });
        }
      }
    }

    if (schema.nonNegativeNumber) {
      const fields = Array.isArray(schema.nonNegativeNumber) ? schema.nonNegativeNumber : [schema.nonNegativeNumber];
      for (const field of fields) {
        const value = req.body?.[field];
        if (value !== undefined && value !== null && !validation.isNonNegativeNumber(value)) {
          errors.push({ field, message: `${field} must be a non-negative number` });
        }
      }
    }

    if (schema.enum) {
      for (const [field, allowed] of Object.entries(schema.enum)) {
        const value = req.body?.[field];
        if (value !== undefined && value !== null && !validation.isInEnum(value, allowed)) {
          errors.push({ field, message: `${field} must be one of: ${allowed.join(", ")}` });
        }
      }
    }

    if (schema.custom && typeof schema.custom === "function") {
      const customErrors = schema.custom(req.body, req);
      if (customErrors) {
        const customArray = Array.isArray(customErrors) ? customErrors : [customErrors];
        for (const err of customArray) {
          errors.push(err);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

module.exports = { validate };
