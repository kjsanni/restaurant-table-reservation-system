const db = require("../db/models");
const PermissionTemplate = db.permissionTemplate;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const findAllTemplates = async (tenantId) => {
  return await PermissionTemplate.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
    order: [["id", "ASC"]],
  });
};

const findTemplateById = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return await PermissionTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
};

const findTemplateByName = async (name, tenantId) => {
  return await PermissionTemplate.findOne({ where: withTenant({ name }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const createTemplate = async (templateData, tenantId) => {
  return await PermissionTemplate.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...templateData,
    ...withTenant({}, tenantId),
  });
};

const updateTemplate = async (id, updates, tenantId) => {
  const template = await PermissionTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!template) return null;
  return await template.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteTemplate = async (id, tenantId) => {
  const template = await PermissionTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!template) return null;
  await template.destroy();
  return true;
};

const searchTemplates = async (query, tenantId) => {
  const like = `%${query}%`;
  return await PermissionTemplate.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({
      [Op.or]: [
        { name: { [Op.like]: like } },
        { description: { [Op.like]: like } },
      ],
    }, tenantId),
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
