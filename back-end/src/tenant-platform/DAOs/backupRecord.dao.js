const db = require("../../db/models");

const backupRecordDAO = {};

backupRecordDAO.create = async (payload) => {
  return await db.backupRecord.create(payload);
};

backupRecordDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  return db.backupRecord.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

backupRecordDAO.findById = (id) => {
  return db.backupRecord.findByPk(id);
};

backupRecordDAO.update = async (id, updates) => {
  const record = await backupRecordDAO.findById(id);
  if (!record) return null;
  await record.update(updates);
  return record;
};

backupRecordDAO.getLatest = (status = "completed") => {
  return db.backupRecord.findOne({
    where: { status },
    order: [["createdAt", "DESC"]],
  });
};

backupRecordDAO.findScheduled = () => {
  return db.backupRecord.findAll({
    where: {
      frequency: { [db.Sequelize.Op.ne]: null },
      nextRunAt: { [db.Sequelize.Op.lte]: new Date() },
    },
    order: [["nextRunAt", "ASC"]],
    limit: 10,
  });
};

backupRecordDAO.updateScheduling = async (id, updates) => {
  const record = await backupRecordDAO.findById(id);
  if (!record) return null;
  await record.update(updates);
  return record;
};

module.exports = backupRecordDAO;
