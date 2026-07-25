const nodemailer = require("nodemailer");

const sendDunningEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@vibespotgh.com",
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[DunningEmail] Failed to send email:", err.message);
  }
};

module.exports = {
  sendDunningEmail,
};
