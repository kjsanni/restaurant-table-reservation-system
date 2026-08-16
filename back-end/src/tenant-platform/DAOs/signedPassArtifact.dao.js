"use strict";

const db = require("../../db/models");
const { encrypt, decrypt } = require("../../utils/encryption");

const signedPassArtifactDAO = {};

signedPassArtifactDAO.create = async ({ requestId, platform, artifactType, artifactPath, accessToken, error }) => {
  const status = error ? "failed" : "signed";
  return await db.signedPassArtifact.create({ // codacy-suppress nosql-injection - parameterized ORM call
    requestId,
    platform,
    status,
    artifactType,
    artifactPath,
    accessToken: accessToken ? encrypt(accessToken) : null,
    error,
  });
};

signedPassArtifactDAO.listByRequest = (requestId) => {
  return db.signedPassArtifact.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { requestId },
    order: [["createdAt", "ASC"]],
  });
};

signedPassArtifactDAO.findByRequestAndPlatform = (requestId, platform) => {
  return db.signedPassArtifact.findOne({ // nosemgrep: javascript.lang.security.audit.no-sql-injection - Sequelize parameterized where, not MongoDB // codacy-suppress nosql-injection - parameterized ORM call
    where: { requestId, platform },
    order: [["createdAt", "DESC"]],
  });
};

signedPassArtifactDAO.getDecryptedAccessToken = (artifact) => {
  if (!artifact || !artifact.accessToken) return null;
  return decrypt(artifact.accessToken);
};

module.exports = signedPassArtifactDAO;
