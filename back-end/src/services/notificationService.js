/**
 * Notification service.
 *
 * Email is sent via the DB-configured SMTP server (see emailService).
 * SMS remains a provider stub (Twilio) pending credentials.
 */
const logger = require("../utils/logger");
const emailService = require("./emailService");

const provider = process.env.NOTIFICATION_PROVIDER || "db-smtp";

const sendSMS = async ({ to, body }) => {
  if (provider === "twilio") {
    // TODO: integrate Twilio SDK (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)
    throw new Error("Twilio SMS provider not yet implemented");
  }
  logger.info(`[notification:${provider}] SMS -> ${to}: ${body}`);
  return { delivered: false, provider };
};

const sendEmail = async ({ to, subject, text, html }) => {
  return await emailService.sendEmail({ to, subject, text, html });
};

const notifyReservationConfirmed = async (customer, reservation) => {
  const body = `Reservation confirmed for ${reservation.resDate} at ${reservation.resTime}.`;
  if (customer.phone) await sendSMS({ to: customer.phone, body });
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: "Reservation Confirmed",
      text: body,
    });
  }
};

module.exports = { sendSMS, sendEmail, notifyReservationConfirmed, provider };
