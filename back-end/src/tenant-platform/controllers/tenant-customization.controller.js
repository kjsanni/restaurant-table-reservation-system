const TenantCustomization = require("../services/tenant-customization.service");

const getThemeSettingsHandler = async (req, res) => {
  try {
    const theme = await TenantCustomization.getThemeSettings(req.tenant?.id);
    res.status(200).json({ success: true, data: theme || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setThemeSettingsHandler = async (req, res) => {
  try {
    const theme = await TenantCustomization.setThemeSettings(req.tenant?.id, req.body);
    res.status(200).json({ success: true, data: theme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getLocaleSettingsHandler = async (req, res) => {
  try {
    const locale = await TenantCustomization.getLocaleSettings(req.tenant?.id);
    res.status(200).json({ success: true, data: locale || { language: "en", strings: {} } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setLocaleStringsHandler = async (req, res) => {
  try {
    const locale = await TenantCustomization.setLocaleStrings(req.tenant?.id, req.body.strings || {});
    res.status(200).json({ success: true, data: locale });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getCustomDomainHandler = async (req, res) => {
  try {
    const domain = await TenantCustomization.getCustomDomain(req.tenant?.id);
    res.status(200).json({ success: true, data: domain || { domain: null, slug: null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setCustomDomainHandler = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, message: "Domain is required" });
    }
    const result = await TenantCustomization.setCustomDomain(req.tenant?.id, domain);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const removeCustomDomainHandler = async (req, res) => {
  try {
    const result = await TenantCustomization.removeCustomDomain(req.tenant?.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getThemeSettingsHandler,
  setThemeSettingsHandler,
  getLocaleSettingsHandler,
  setLocaleStringsHandler,
  getCustomDomainHandler,
  setCustomDomainHandler,
  removeCustomDomainHandler,
};
