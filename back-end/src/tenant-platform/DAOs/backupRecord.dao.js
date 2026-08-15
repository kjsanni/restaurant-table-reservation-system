const db = require("../../db/models");
const baseDAO = require("./base.dao");

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

backupRecordDAO.update = async (id, updates) => baseDAO.updateById(db.backupRecord, id, updates);

backupRecordDAO.getLatest = (status = "completed") => {
// codacy-suppress NoSqlInjection
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

backupRecordDAO.updateScheduling = async (id, updates) => baseDAO.updateById(db.backupRecord, id, updates);

module.exports = backupRecordDAO;
