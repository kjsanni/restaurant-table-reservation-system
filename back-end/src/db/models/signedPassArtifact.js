"use strict";

module.exports = (sequelize, DataTypes) => {
  const SignedPassArtifact = sequelize.define(
    "signedPassArtifact",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
      tableName: "signed_pass_artifacts",
      timestamps: true,
    }
  );

  SignedPassArtifact.associate = (models) => {
    if (models.passSigningRequest) {
      SignedPassArtifact.belongsTo(models.passSigningRequest, {
        foreignKey: "requestId",
        as: "signingRequest",
      });
    }
  };

  return SignedPassArtifact;
};
