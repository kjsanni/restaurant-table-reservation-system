"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GalleryImage extends Model {
    static associate(models) {}
  }

  GalleryImage.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      caption: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "galleryImage",
      tableName: "gallery_images",
    }
  );

  return GalleryImage;
};
