import * as audit from "./admin/auditAPI";
import * as support from "./admin/supportAPI";
import * as financial from "./admin/financialAPI";
import * as tenantManagement from "./admin/tenantManagementAPI";
import * as compliance from "./admin/complianceAPI";
import * as monitoring from "./admin/monitoringAPI";
import * as integration from "./admin/integrationAPI";
import * as vertical from "./admin/verticalAPI";
import * as platformAdmin from "./admin/platformAdminAPI";

export default {
  ...audit,
  ...support,
  ...financial,
  ...tenantManagement,
  ...compliance,
  ...monitoring,
  ...integration,
  ...vertical,
  ...platformAdmin,
};
