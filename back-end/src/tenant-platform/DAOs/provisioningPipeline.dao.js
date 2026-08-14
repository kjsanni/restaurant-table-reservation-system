"use strict";

const db = require("../../db/models");

const provisioningPipelineDAO = {};

provisioningPipelineDAO.findByTenantId = async (tenantId) => {
  return db.provisioningPipeline.findOne({ where: { tenantId } }); // nosemgrep: javascript.lang.security.audit.no-sql-injection - Sequelize parameterized where, not MongoDB
};

provisioningPipelineDAO.upsert = async (pipeline) => {
  const record = await db.provisioningPipeline.findOne({ where: { tenantId: pipeline.tenantId } });
  if (record) {
    await record.update({
      status: pipeline.status,
      currentStepIndex: pipeline.currentStepIndex,
      steps: pipeline.steps,
      error: pipeline.error || null,
      completedAt: pipeline.completedAt || null,
      actorUserId: pipeline.actorUserId || record.actorUserId,
    });
    return record;
  }
  return db.provisioningPipeline.create({
    tenantId: pipeline.tenantId,
    actorUserId: pipeline.actorUserId,
    status: pipeline.status,
    currentStepIndex: pipeline.currentStepIndex,
    steps: pipeline.steps,
    error: pipeline.error || null,
    startedAt: pipeline.startedAt || new Date(),
    completedAt: pipeline.completedAt || null,
  });
};

module.exports = provisioningPipelineDAO;
