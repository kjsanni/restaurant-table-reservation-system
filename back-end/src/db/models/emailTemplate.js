module.exports = (sequelize, DataTypes) => {
  const EmailTemplate = sequelize.define("emailTemplate", {
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    variables: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ["tenantId", "key"],
      },
    ],
  });

  return EmailTemplate;
};