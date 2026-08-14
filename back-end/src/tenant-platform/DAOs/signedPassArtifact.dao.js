"use strict";

const db = require("../../db/models");

const signedPassArtifactDAO = {};

signedPassArtifactDAO.create = async ({ requestId, platform, artifactType, artifactPath, accessToken, error }) => {
  const status = error ? "failed" : "signed";
  return await db.signedPassArtifact.create({
    requestId,
    platform,
    status,
    artifactType,
    artifactPath,
    accessToken,
    error,
  });
};

signedPassArtifactDAO.listByRequest = (requestId) => {
  return db.signedPassArtifact.findAll({
    where: { requestId },
    order: [["createdAt", "ASC"]],
  });
};

signedPassArtifactDAO.findByRequestAndPlatform = (requestId, platform) => {
  return db.signedPassArtifact.findOne({
    where: { requestId, platform },
    order: [["createdAt", "DESC"]],
  });
};

module.exports = signedPassArtifactDAO;
