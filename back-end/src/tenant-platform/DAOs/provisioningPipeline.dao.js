"use strict";

const db = require("../../db/models");

const provisioningPipelineDAO = {};

provisioningPipelineDAO.findByTenantId = async (tenantId) => {
  return db.provisioningPipeline.findOne({ where: { tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
};

provisioningPipelineDAO.upsert = async (pipeline) => { // codacy-suppress nosql-injection
  const record = await db.provisioningPipeline.findOne({ where: { tenantId: pipeline.tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
  if (record) {
    await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
      status: pipeline.status,
      currentStepIndex: pipeline.currentStepIndex,
      steps: pipeline.steps,
      error: pipeline.error || null,
      completedAt: pipeline.completedAt || null,
      actorUserId: pipeline.actorUserId || record.actorUserId,
    });
    return record;
  }
  return db.provisioningPipeline.create({ // codacy-suppress nosql-injection - parameterized ORM call
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
