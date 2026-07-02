const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.join(__dirname, "../../../logs");
const ALLOWED_EXT = ".log";

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw {
      status: 500,
      message: "Mail server is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.",
    };
  }

  return nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: Number(process.env.SMTP_SECURE || 0) === 1,
    auth: { user, pass },
  });
};

const getLogFiles = () => {
  if (!fs.existsSync(LOGS_DIR)) return [];
  return fs
    .readdirSync(LOGS_DIR)
    .filter((file) => path.extname(file).toLowerCase() === ALLOWED_EXT)
    .map((file) => ({
      name: file,
      fullPath: path.join(LOGS_DIR, file),
      mtime: fs.statSync(path.join(LOGS_DIR, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
};

const cleanOldLogs = (files, keep = 5) => {
  const toDelete = files.slice(keep);
  toDelete.forEach((file) => {
    try {
      fs.unlinkSync(file.fullPath);
    } catch (err) {
      console.warn(`Failed to delete old log ${file.name}:`, err.message);
    }
  });
};

const sendLogsEmail = async () => {
  const files = getLogFiles();
  if (files.length === 0) {
    throw { status: 404, message: "No log files found to send." };
  }

  cleanOldLogs(files, 5);

  const recentFiles = files.slice(0, 5);
  const recipient = process.env.LOG_EMAIL_RECIPIENT;
  if (!recipient) {
    throw { status: 500, message: "LOG_EMAIL_RECIPIENT is not configured." };
  }

  const attachments = recentFiles.map((file) => ({
    filename: file.name,
    path: file.fullPath,
  }));

  const transporter = buildTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: `Server logs - ${new Date().toISOString()}`,
    text: "Attached are the current server logs.",
    attachments,
  });
};

module.exports = {
  sendLogsEmail,
};
