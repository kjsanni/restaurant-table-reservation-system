"use strict";

const db = require("../../db/models");

const ChangeManagement = {
  async createDeprecationNotice({ title, message, sunsetDate, affectedRoutes, severity = "info" }) {
    const notice = await db.announcement.create({
      title,
      message,
      type: "deprecation",
      severity,
      publishedAt: new Date(),
      expiresAt: new Date(sunsetDate),
      metadata: {
        affectedRoutes: affectedRoutes || [],
        sunsetDate,
      },
    });
    return notice;
  },

  async getActiveDeprecations() {
    const now = new Date();
    const notices = await db.announcement.findAll({
      where: {
        type: "deprecation",
        publishedAt: { [db.Sequelize.Op.lte]: now },
        expiresAt: { [db.Sequelize.Op.gte]: now },
      },
      order: [["publishedAt", "DESC"]],
    });
    return notices;
  },

  async createInAppBanner({ tenantId, message, severity = "info", actionUrl, expiresAt }) {
    const banner = await db.notification.create({
      userId: null,
      tenantId,
      type: "in_app_banner",
      title: "Platform Update",
      message,
      data: {
        severity,
        actionUrl,
        expiresAt,
      },
      read: false,
    });
    return banner;
  },

  async getTenantBanners(tenantId) {
    const now = new Date();
    const banners = await db.notification.findAll({
      where: {
        tenantId,
        type: "in_app_banner",
        read: false,
      },
      order: [["createdAt", "DESC"]],
    });
    return banners.filter((b) => {
      const expiresAt = b.data?.expiresAt ? new Date(b.data.expiresAt) : null;
      return !expiresAt || expiresAt > now;
    });
  },

  async createNotificationTemplate({ key, subject, body, channels = ["email"] }) {
    const template = await db.notificationTemplate.create({
      key,
      subject,
      body,
      channels: JSON.stringify(channels),
      isActive: true,
    });
    return template;
  },

  async getNotificationTemplates() {
    const templates = await db.notificationTemplate.findAll({
      where: { isActive: true },
      order: [["key", "ASC"]],
    });
    return templates.map((t) => ({
      ...t.toJSON(),
      channels: JSON.parse(t.channels || "[]"),
    }));
  },
};

module.exports = ChangeManagement;
