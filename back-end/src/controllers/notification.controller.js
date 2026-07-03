const notificationService = require("../services/notification.service");

const scheduleRemindersHandler = async (req, res) => {
  const results = await notificationService.scheduleReminders();
  return res.status(200).json({ success: true, results });
};

module.exports = {
  scheduleRemindersHandler,
};
