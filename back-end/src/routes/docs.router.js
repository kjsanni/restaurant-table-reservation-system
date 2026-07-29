const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const openApiPath = path.join(__dirname, "../../docs/openapi.json");

router.get("/openapi.json", (req, res) => {
  try {
    const spec = fs.readFileSync(openApiPath, "utf-8");
    res.setHeader("Content-Type", "application/json");
    res.send(spec);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load API spec" });
  }
});

module.exports = router;
