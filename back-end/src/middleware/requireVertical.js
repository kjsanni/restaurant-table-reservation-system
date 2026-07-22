"use strict";

const requireVertical = (vertical) => (req, res, next) => {
  if (req.tenant?.businessVertical !== vertical) {
    return res.status(404).json({ message: "Not available for this tenant" });
  }
  next();
};

module.exports = { requireVertical };
