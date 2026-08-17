"use strict";

const validateEventInput = (req, res, next) => {
  const { body, params } = req;
  const errors = [];

  if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
    if (body && typeof body.name === "string" && body.name.trim().length > 255) {
      errors.push("Event name must be 255 characters or fewer");
    }
    if (body && typeof body.capacity === "number" && body.capacity < 0) {
      errors.push("Capacity must be a positive number");
    }
    if (body && typeof body.price !== "undefined" && isNaN(Number(body.price))) {
      errors.push("Price must be a valid number");
    }
    if (body && typeof body.quantity !== "undefined" && (isNaN(Number(body.quantity)) || Number(body.quantity) < 0)) {
      errors.push("Quantity must be a positive number");
    }
  }

  if (req.method === "POST" && params.eventId && isNaN(Number(params.eventId))) {
    errors.push("Invalid event ID");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(". ") });
  }

  next();
};

module.exports = { validateEventInput };
