const db = require("../../db/models");

const supportMessageDAO = {};

supportMessageDAO.create = async (payload) => {
  return await db.supportMessage.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

supportMessageDAO.list = (conversationId) => {
  return db.supportMessage.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
};

module.exports = supportMessageDAO;
