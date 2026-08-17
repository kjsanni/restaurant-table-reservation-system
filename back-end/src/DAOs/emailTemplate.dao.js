const db = require("../db/models");
const EmailTemplate = db.emailTemplate;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const getAllTemplates = async (tenantId) => {
  return await EmailTemplate.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
    order: [["name", "ASC"]],
  });
};

const getTemplateByKey = async (key, tenantId) => {
// codacy-suppress NoSqlInjection
  return await EmailTemplate.findOne({ where: withTenant({ key }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const getTemplateById = async (id, tenantId) => {
  return await EmailTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
};

const createTemplate = async (data, tenantId) => {
  return await EmailTemplate.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    ...withTenant({}, tenantId),
  });
};

const updateTemplate = async (id, data, tenantId) => {
  const template = await EmailTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!template) return null;
  return await template.update(data); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteTemplate = async (id, tenantId) => {
  const template = await EmailTemplate.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!template) return null;
  await template.destroy();
  return true;
};

module.exports = {
  getAllTemplates,
  getTemplateByKey,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};