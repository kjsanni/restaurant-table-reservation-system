const { Worker } = require("bullmq");
const { connection } = require("./queue");

const startNotificationWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "notifications",
    async (job) => {
      const { type, payload } = job.data;
      switch (type) {
        case "email":
          return await sendEmailJob(payload);
        case "whatsapp":
          return await sendWhatsAppJob(payload);
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
};

const sendEmailJob = async (payload) => {
  const { to, templateKey, data, tenantId } = payload;
  const emailService = require("../services/emailService");
  return await emailService.sendTemplate({ templateKey, to, data }, tenantId);
};

const sendWhatsAppJob = async (payload) => {
  const { to, text, tenantId } = payload;
  const whatsappService = require("../services/whatsapp.service");
  return await whatsappService.sendWhatsAppText(to, text, tenantId);
};

module.exports = { startNotificationWorker };
