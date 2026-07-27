const caseStudyDAO = require("../DAOs/caseStudy.dao");

const caseStudyController = {};

caseStudyController.listCaseStudiesHandler = async (req, res) => {
  const data = await caseStudyDAO.listCaseStudies({ includeTenant: true });
  res.status(200).json({ success: true, collection: data });
};

caseStudyController.createCaseStudyHandler = async (req, res) => {
  const study = await caseStudyDAO.createCaseStudy(req.body);
  res.status(201).json({ success: true, item: study });
};

caseStudyController.updateCaseStudyHandler = async (req, res) => {
  const study = await caseStudyDAO.updateCaseStudy(req.params.id, req.body);
  if (!study) return res.status(404).json({ success: false, message: "Case study not found" });
  res.status(200).json({ success: true, item: study });
};

caseStudyController.removeCaseStudyHandler = async (req, res) => {
  const removed = await caseStudyDAO.removeCaseStudy(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: "Case study not found" });
  res.status(200).json({ success: true });
};

module.exports = caseStudyController;
