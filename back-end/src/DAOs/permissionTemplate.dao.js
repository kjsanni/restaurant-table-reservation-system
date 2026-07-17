const db = require("../db/models");
const PermissionTemplate = db.permissionTemplate;
const { Op } = db.Sequelize;

const findAllTemplates = async () => {
  return await PermissionTemplate.findAll({ order: [["id", "ASC"]] });
};

const findTemplateById = async (id) => {
  return await PermissionTemplate.findByPk(id);
};

const findTemplateByName = async (name) => {
  return await PermissionTemplate.findOne({ where: { name } });
};

const createTemplate = async (templateData) => {
  return await PermissionTemplate.create(templateData);
};

const updateTemplate = async (id, updates) => {
  const template = await PermissionTemplate.findByPk(id);
  if (!template) return null;
  return await template.update(updates);
};

const deleteTemplate = async (id) => {
  const template = await PermissionTemplate.findByPk(id);
  if (!template) return null;
  await template.destroy();
  return true;
};

const searchTemplates = async (query) => {
  const like = `%${query}%`;
  return await PermissionTemplate.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: like } },
        { description: { [Op.like]: like } },
      ],
    },
    order: [["id", "ASC"]],
  });
};

module.exports = {
  findAllTemplates,
  findTemplateById,
  findTemplateByName,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
};
