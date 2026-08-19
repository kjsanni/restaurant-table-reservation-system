const ChangeManagement = require("../services/change-management.service");

const createDeprecationNoticeHandler = async (req, res) => {
  try {
    const notice = await ChangeManagement.createDeprecationNotice(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getActiveDeprecationsHandler = async (req, res) => {
  try {
    const notices = await ChangeManagement.getActiveDeprecations();
    res.status(200).json({ success: true, data: notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createInAppBannerHandler = async (req, res) => {
  try {
    const { tenantId, message, severity, actionUrl, expiresAt } = req.body;
    const banner = await ChangeManagement.createInAppBanner({
      tenantId: tenantId || req.tenant?.id,
      message,
      severity,
      actionUrl,
      expiresAt,
    });
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getTenantBannersHandler = async (req, res) => {
  try {
    const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : req.tenant?.id;
    const banners = await ChangeManagement.getTenantBanners(tenantId);
    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createNotificationTemplateHandler = async (req, res) => {
  try {
    const template = await ChangeManagement.createNotificationTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getNotificationTemplatesHandler = async (req, res) => {
  try {
    const templates = await ChangeManagement.getNotificationTemplates();
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createDeprecationNoticeHandler,
  getActiveDeprecationsHandler,
  createInAppBannerHandler,
  getTenantBannersHandler,
  createNotificationTemplateHandler,
  getNotificationTemplatesHandler,
};
