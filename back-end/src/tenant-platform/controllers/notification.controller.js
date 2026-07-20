const notificationDAO = require("../DAOs/notification.dao");

const listNotificationsHandler = async (req, res) => {
  const userId = req.user?.id || null;
  const tenantId = req.query.tenantId ? parseInt(req.query.tenantId, 10) : null;
  const data = await notificationDAO.list(userId, tenantId);
  res.status(200).json({ success: true, collection: data });
};

const createNotificationHandler = async (req, res) => {
  const { type, title, message, tenantId } = req.body;
  if (!type || !title) {
    return res.status(400).json({ success: false, message: "type and title are required" });
  }
  const userId = req.user?.id || null;
  const record = await notificationDAO.create({
    userId,
    tenantId: tenantId || null,
    type,
    title,
    message,
  });
  res.status(201).json({ success: true, item: record });
};

const markReadHandler = async (req, res) => {
  await notificationDAO.markRead(req.params.id, req.user?.id);
  res.status(200).json({ success: true });
};

module.exports = {
  listNotificationsHandler,
  createNotificationHandler,
  markReadHandler,
};
