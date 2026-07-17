const logEmailService = require("../services/logEmail.service");

const emailLogsHandler = async (req, res) => {
  await logEmailService.sendLogsEmail();

  return res.status(200).json({
    success: true,
    message: "Logs sent successfully!",
  });
};

module.exports = {
  emailLogsHandler,
};
