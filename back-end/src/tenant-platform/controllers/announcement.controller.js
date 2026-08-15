const response = require("../utils/response");

const announcementDAO = require("../DAOs/announcement.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listAnnouncementsHandler = async (req, res) => {
  const { channel, isActive } = req.query;
  const data = await announcementDAO.list({
    channel: channel || undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createAnnouncementHandler = async (req, res) => {
  const { title, message, channel, priority, isActive, scheduledAt } = req.body;
  if (!title || !message) {
    return response.badRequest(res, "title and message are required");
  }

  const announcement = await announcementDAO.create({
    title,
    message,
    channel: channel || "all",
    priority: priority || "medium",
    isActive: isActive ?? true,
    scheduledAt: scheduledAt || null,
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.announcement_created",
    "announcement",
    announcement.id,
    null,
    { title, channel },
    req.ip
  );

  res.status(201).json({ success: true, item: announcement });
};

const updateAnnouncementHandler = async (req, res) => {
  const { title, message, channel, priority, isActive, scheduledAt } = req.body;
  const announcement = await announcementDAO.update(req.params.id, {
    title: title ?? undefined,
    message: message ?? undefined,
    channel: channel ?? undefined,
    priority: priority ?? undefined,
    isActive: isActive ?? undefined,
    scheduledAt: scheduledAt ?? undefined,
  });

  if (!announcement) {
    return response.notFound(res, "Announcement not found");
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.announcement_updated",
    "announcement",
    announcement.id,
    null,
    { title: announcement.title },
    req.ip
  );

  res.status(200).json({ success: true, item: announcement });
};

const deleteAnnouncementHandler = async (req, res) => {
  const announcement = await announcementDAO.remove(req.params.id);
  if (!announcement) {
    return response.notFound(res, "Announcement not found");
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.announcement_deleted",
    "announcement",
    announcement.id,
    null,
    { title: announcement.title },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listAnnouncementsHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
};
