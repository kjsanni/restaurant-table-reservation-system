const notificationService = require("../services/notification.service");

const scheduleRemindersHandler = async (req, res) => {
  const results = await notificationService.scheduleReminders(req.tenant?.id);
  return res.status(200).json({ success: true, results });
};

module.exports = {
  scheduleRemindersHandler,
};
