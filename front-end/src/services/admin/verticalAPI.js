import API from "../API";

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const listVerticalTemplates = () => {
  return API.get("/admin/vertical-templates");
};

export const createVerticalTemplate = (data) => {
  return API.post("/admin/vertical-templates", data);
};

export const updateVerticalTemplate = (id, data) => {
  return API.patch(`/admin/vertical-templates/${id}`, data);
};

export const deleteVerticalTemplate = (id) => {
  return API.delete(`/admin/vertical-templates/${id}`);
};

export const cloneVerticalTemplate = (id) => {
  return API.post(`/admin/vertical-templates/${id}/clone`);
};

export const getVerticalTemplateUsage = () => {
  return API.get("/admin/vertical-templates/usage");
};

export const getVerticalAnalytics = () => {
  return API.get("/admin/vertical-analytics");
};

export const listMarketplaceListings = () => {
  return API.get("/admin/marketplace/listings");
};

export const createMarketplaceListing = (data) => {
  return API.post("/admin/marketplace/listings", data);
};

export const updateMarketplaceListing = (id, data) => {
  return API.patch(`/admin/marketplace/listings/${id}`, data);
};

export const removeMarketplaceListing = (id) => {
  return API.delete(`/admin/marketplace/listings/${id}`);
};

export const listCaseStudies = () => {
  return API.get("/admin/case-studies");
};

export const createCaseStudy = (data) => {
  return API.post("/admin/case-studies", data);
};

export const updateCaseStudy = (id, data) => {
  return API.patch(`/admin/case-studies/${id}`, data);
};

export const removeCaseStudy = (id) => {
  return API.delete(`/admin/case-studies/${id}`);
};

export const listPlatformReferrals = () => {
  return API.get("/admin/referrals");
};

export const createPlatformReferral = (data) => {
  return API.post("/admin/referrals", data);
};

export const updatePlatformReferral = (id, data) => {
  return API.patch(`/admin/referrals/${id}`, data);
};

export const listAutoScalingTriggers = (params = {}) => {
  return API.get(`/admin/auto-scaling${buildQueryString(params)}`);
};

export const getAutoScalingTrigger = (id) => {
  return API.get(`/admin/auto-scaling/${id}`);
};

export const createAutoScalingTrigger = (data) => {
  return API.post("/admin/auto-scaling", data);
};

export const updateAutoScalingTrigger = (id, data) => {
  return API.patch(`/admin/auto-scaling/${id}`, data);
};

export const deleteAutoScalingTrigger = (id) => {
  return API.delete(`/admin/auto-scaling/${id}`);
};

export const listPlatformReports = () => {
  return API.get("/admin/platform-reports");
};

export const createPlatformReport = (data) => {
  return API.post("/admin/platform-reports", data);
};

export const getPlatformReport = (id) => {
  return API.get(`/admin/platform-reports/${id}`);
};

export const downloadPlatformReport = (id) => {
  return API.get(`/admin/platform-reports/${id}/download`, {
    responseType: "blob",
  });
};

export const deletePlatformReport = (id) => {
  return API.delete(`/admin/platform-reports/${id}`);
};
