const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const rbacController = require("../controllers/rbac.controller");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/roles")
  .get(...protectedRoute("manage_roles", rbacController.getAllRolesHandler))
  .post(...writeRoute("manage_roles", rbacController.createRoleHandler))
  .all(httpMethodError);

router
  .route("/roles/:id")
  .get(...protectedRoute("manage_roles", rbacController.getRoleHandler))
  .patch(...writeRoute("manage_roles", rbacController.updateRoleHandler))
  .delete(...writeRoute("manage_roles", rbacController.deleteRoleHandler))
  .all(httpMethodError);

router
  .route("/groups")
  .get(...protectedRoute("manage_groups", rbacController.getAllGroupsHandler))
  .post(...writeRoute("manage_groups", rbacController.createGroupHandler))
  .all(httpMethodError);

router
  .route("/groups/name/:name")
  .get(...protectedRoute("manage_groups", rbacController.getGroupByNameHandler))
  .all(httpMethodError);

router
  .route("/groups/:id")
  .get(...protectedRoute("manage_groups", rbacController.getGroupHandler))
  .patch(...writeRoute("manage_groups", rbacController.updateGroupHandler))
  .delete(...writeRoute("manage_groups", rbacController.deleteGroupHandler))
  .all(httpMethodError);

router
  .route("/groups/:id/users")
  .post(...writeRoute("manage_groups", rbacController.addUserToGroupHandler))
  .all(httpMethodError);

router
  .route("/groups/:id/users/:userId")
  .delete(...writeRoute("manage_groups", rbacController.removeUserFromGroupHandler))
  .all(httpMethodError);

module.exports = router;
