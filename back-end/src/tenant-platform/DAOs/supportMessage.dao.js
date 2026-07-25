const db = require("../../db/models");

const supportMessageDAO = {};

supportMessageDAO.create = async (payload) => {
  return await db.supportMessage.create(payload);
};

supportMessageDAO.list = (conversationId) => {
  return db.supportMessage.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
};

module.exports = supportMessageDAO;
