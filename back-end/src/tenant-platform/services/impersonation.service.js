"use strict";

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const ImpersonationService = {
  async createImpersonationSession({ superAdminId, tenantId, reason }) {
    const superAdmin = await db.user.findByPk(superAdminId);
    const tenant = await db.tenant.findByPk(tenantId);

    if (!superAdmin || !tenant) {
      throw new Error("Invalid super-admin or tenant");
    }

    if (["cancelled", "suspended", "deleted"].includes(tenant.status)) {
      throw new Error(`Cannot impersonate a ${tenant.status} tenant`);
    }

    const session = await db.impersonationSession.create({
      superAdminId,
      tenantId,
      reason,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      active: true,
    });

    await platformAuditDAO.log({
      action: "impersonation.started",
      actorUserId: superAdminId,
      tenantId,
      metadata: { reason, sessionId: session.id },
    });

    return session;
  },

  async endImpersonationSession(sessionId, superAdminId) {
    const session = await db.impersonationSession.findByPk(sessionId);
    if (!session || !session.active) {
      throw new Error("Session not found or already ended");
    }

    await session.update({
      active: false,
      endedAt: new Date(),
      endedBy: superAdminId,
    });

    await platformAuditDAO.log({
      action: "impersonation.ended",
      actorUserId: superAdminId,
      tenantId: session.tenantId,
      metadata: { sessionId: session.id },
    });

    return session;
  },

  async getActiveImpersonationSessions(tenantId) {
    return await db.impersonationSession.findAll({
      where: { tenantId, active: true },
      include: [{ model: db.user, as: "superAdmin", attributes: ["id", "username", "email"] }],
    });
  },
};

module.exports = ImpersonationService;
