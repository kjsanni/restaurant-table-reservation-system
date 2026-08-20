"use strict";

const validation = require("../utils/validation");

const validateRequired = (fields, body, errors) => {
  if (!fields) return errors;
  const result = validation.required(fields, body);
  if (!result.valid) {
    for (const field of result.missing) {
      errors.push({ field, message: `${field} is required` });
    }
  }
  return errors;
};

const validateEmail = (fields, body, errors) => {
  if (!fields) return errors;
  const list = Array.isArray(fields) ? fields : [fields];
  for (const field of list) {
    const value = body?.[field];
    if (value && !validation.isValidEmail(value)) {
      errors.push({ field, message: `${field} must be a valid email address` });
    }
  }
  return errors;
};

const validatePhone = (fields, body, errors) => {
  if (!fields) return errors;
  const list = Array.isArray(fields) ? fields : [fields];
  for (const field of list) {
    const value = body?.[field];
    if (value && !validation.isValidPhone(value)) {
      errors.push({ field, message: `${field} must be a valid phone number` });
    }
  }
  return errors;
};

const validatePositiveInteger = (fields, body, errors) => {
  if (!fields) return errors;
  const list = Array.isArray(fields) ? fields : [fields];
  for (const field of list) {
    const value = body?.[field];
    if (value !== undefined && value !== null && !validation.isPositiveInteger(value)) {
      errors.push({ field, message: `${field} must be a positive integer` });
    }
  }
  return errors;
};

const validateNonNegativeNumber = (fields, body, errors) => {
  if (!fields) return errors;
  const list = Array.isArray(fields) ? fields : [fields];
  for (const field of list) {
    const value = body?.[field];
    if (value !== undefined && value !== null && !validation.isNonNegativeNumber(value)) {
      errors.push({ field, message: `${field} must be a non-negative number` });
    }
  }
  return errors;
};

const validateEnum = (fields, body, errors) => {
  if (!fields) return errors;
  for (const [field, allowed] of Object.entries(fields)) {
    const value = body?.[field];
    if (value !== undefined && value !== null && !validation.isInEnum(value, allowed)) {
      errors.push({ field, message: `${field} must be one of: ${allowed.join(", ")}` });
    }
  }
  return errors;
};

const validateCustom = (custom, body, req, errors) => {
  if (!custom || typeof custom !== "function") return errors;
  const customErrors = custom(body, req);
  if (customErrors) {
    const customArray = Array.isArray(customErrors) ? customErrors : [customErrors];
    for (const err of customArray) {
      errors.push(err);
    }
  }
  return errors;
};

const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    validateRequired(schema.required, req.body, errors);
    validateEmail(schema.email, req.body, errors);
    validatePhone(schema.phone, req.body, errors);
    validatePositiveInteger(schema.positiveInteger, req.body, errors);
    validateNonNegativeNumber(schema.nonNegativeNumber, req.body, errors);
    validateEnum(schema.enum, req.body, errors);
    validateCustom(schema.custom, req.body, req, errors);

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
