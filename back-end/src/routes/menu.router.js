const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const menuController = require("../controllers/menu.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/categories")
  .get(protectedRoute("view_menu", menuController.getCategoriesHandler))
  .post(writeRoute("manage_menu", menuController.getCategoriesHandler))
  .all(httpMethodError);

router
  .route("/items")
  .get(protectedRoute("view_menu", menuController.getMenuItemsHandler))
  .post(writeRoute("manage_menu", menuController.getMenuItemsHandler))
  .all(httpMethodError);

router
  .route("/available")
  .get(protectedRoute("view_menu", menuController.getAvailableMenuHandler))
  .all(httpMethodError);

router
  .route("/items/:id")
  .get(protectedRoute("view_menu", menuController.getMenuItemDetailHandler))
  .patch(writeRoute("manage_menu", menuController.getMenuItemDetailHandler))
  .delete(writeRoute("manage_menu", menuController.getMenuItemDetailHandler))
  .all(httpMethodError);

module.exports = router;
