const revenueDAO = require("../DAOs/revenue.dao");

const getMrrTrendsHandler = async (req, res) => {
  const months = parseInt(req.query.months, 10) || 12;
  const data = await revenueDAO.getMrrTrends(months);
  res.status(200).json({ success: true, collection: data });
};

const getRevenueByPlanHandler = async (req, res) => {
  const data = await revenueDAO.getRevenueByPlan();
  res.status(200).json({ success: true, collection: data });
};

const getLtvHandler = async (req, res) => {
  const data = await revenueDAO.getLtvByTenant();
  res.status(200).json({ success: true, collection: data });
};

const getCohortAnalysisHandler = async (req, res) => {
  const months = parseInt(req.query.months, 10) || 12;
  const data = await revenueDAO.getCohortAnalysis(months);
  res.status(200).json({ success: true, collection: data });
};

const getFeatureAdoptionHandler = async (req, res) => {
  const data = await revenueDAO.getFeatureAdoption();
  res.status(200).json({ success: true, collection: data });
};

const getGeographicDistributionHandler = async (req, res) => {
  const data = await revenueDAO.getGeographicDistribution();
  res.status(200).json({ success: true, collection: data });
};

module.exports = {
  getMrrTrendsHandler,
  getRevenueByPlanHandler,
  getLtvHandler,
  getCohortAnalysisHandler,
  getFeatureAdoptionHandler,
  getGeographicDistributionHandler,
};
