// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const menuController = require("../controllers/menu.controller");
const { protectedRoute } = require("../utils/routeHelpers");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/categories")
  .get(generalLimiter, protectedRoute("view_menu", menuController.getCategoriesHandler))
  .all(httpMethodError);

router
  .route("/items")
  .get(generalLimiter, protectedRoute("view_menu", menuController.getMenuItemsHandler))
  .all(httpMethodError);

router
  .route("/available")
  .get(generalLimiter, protectedRoute("view_menu", menuController.getAvailableMenuHandler))
  .all(httpMethodError);

router
  .route("/items/:id")
  .get(generalLimiter, protectedRoute("view_menu", menuController.getMenuItemDetailHandler))
  .all(httpMethodError);

module.exports = router;
