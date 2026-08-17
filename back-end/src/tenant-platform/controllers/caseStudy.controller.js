const response = require("../utils/response");

const caseStudyDAO = require("../DAOs/caseStudy.dao");

const caseStudyController = {};

caseStudyController.listCaseStudiesHandler = async (req, res) => {
  const data = await caseStudyDAO.listCaseStudies({ includeTenant: true });
  res.status(200).json({ success: true, collection: data });
};

caseStudyController.createCaseStudyHandler = async (req, res) => {
  const allowed = ["title", "content", "imageUrl", "isPublished"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }

  if (!data.title) {
    return response.badRequest(res, "title is required");
  }

  const study = await caseStudyDAO.createCaseStudy(data);
  res.status(201).json({ success: true, item: study });
};

caseStudyController.updateCaseStudyHandler = async (req, res) => {
  const allowed = ["title", "content", "imageUrl", "isPublished"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const tenantId = req.tenant?.id;
  const study = await caseStudyDAO.updateCaseStudy(req.params.id, updates, tenantId);
  if (!study) return response.notFound(res, "Case study not found");
  res.status(200).json({ success: true, item: study });
};

caseStudyController.removeCaseStudyHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  const removed = await caseStudyDAO.removeCaseStudy(req.params.id, tenantId);
  if (!removed) return response.notFound(res, "Case study not found");
  res.status(200).json({ success: true });
};

module.exports = caseStudyController;
