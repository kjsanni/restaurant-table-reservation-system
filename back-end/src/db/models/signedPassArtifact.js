"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SignedPassArtifact extends Model {
    static associate(models) {
      if (models.passSigningRequest) {
        SignedPassArtifact.belongsTo(models.passSigningRequest, {
          foreignKey: "requestId",
          onDelete: "CASCADE",
        });
      }
    }
  }

  SignedPassArtifact.init(
    {
      requestId: { type: DataTypes.INTEGER, allowNull: false },
      platform: {
        type: DataTypes.ENUM("apple", "google", "samsung"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "signed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      artifactType: {
        type: DataTypes.ENUM("file", "url"),
        allowNull: false,
      },
      artifactPath: { type: DataTypes.STRING(500), allowNull: true },
      accessToken: { type: DataTypes.STRING(500), allowNull: true },
      error: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "signedPassArtifact",
      tableName: "signed_pass_artifacts",
      indexes: [{ fields: ["requestId"] }],
    }
  );
  return SignedPassArtifact;
};
