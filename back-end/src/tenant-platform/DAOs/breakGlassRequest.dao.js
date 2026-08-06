const db = require("../../db/models");

const breakGlassRequestDAO = {};

breakGlassRequestDAO.create = async (userId, justification, durationMinutes) => {
  return await db.breakGlassRequest.create({
    userId,
    justification,
    durationMinutes,
    status: "pending",
  });
};

breakGlassRequestDAO.findById = (id) => {
  return db.breakGlassRequest.findByPk(id, {
    include: [
      { model: db.user, as: "requester", attributes: ["id", "username", "email"] },
      { model: db.user, as: "approver", attributes: ["id", "username", "email"] },
    ],
  });
};

breakGlassRequestDAO.listPending = (filters = {}) => {
  const where = { status: "pending" };
  if (filters.userId) where.userId = filters.userId;
  if (filters.approverId) where.approverId = filters.approverId;

  return db.breakGlassRequest.findAll({
    where,
    include: [{ model: db.user, as: "requester", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "ASC"]],
    limit: filters.limit || 100,
  });
};

breakGlassRequestDAO.listForUser = (userId, filters = {}) => {
  const where = { userId };
  if (filters.status) where.status = filters.status;

  return db.breakGlassRequest.findAll({
    where,
    include: [{ model: db.user, as: "approver", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

const applyRequestResolution = async (request, status, approverId, notes, elevatedUntil) => {
  request.status = status;
  request.approverId = approverId;
  request.notes = notes;
  request.resolvedAt = new Date();
  if (elevatedUntil) request.elevatedUntil = elevatedUntil;
  await request.save();
  return request;
};

breakGlassRequestDAO.approve = async (id, approverId, notes) => {
  const request = await breakGlassRequestDAO.findById(id);
  if (!request || request.status !== "pending") return null;

  const elevatedUntil = new Date();
  elevatedUntil.setMinutes(elevatedUntil.getMinutes() + request.durationMinutes);

  await applyRequestResolution(request, "approved", approverId, notes, elevatedUntil);

  const user = await db.user.findByPk(request.userId);
  if (user) {
    user.elevatedUntil = elevatedUntil;
    await user.save();
  }

  return request;
};

breakGlassRequestDAO.deny = async (id, approverId, notes) => {
  const request = await breakGlassRequestDAO.findById(id);
  if (!request || request.status !== "pending") return null;

  await applyRequestResolution(request, "denied", approverId, notes, null);
  return request;
};

breakGlassRequestDAO.revoke = async (id, revokedBy) => {
  const request = await breakGlassRequestDAO.findById(id);
  if (!request || request.status !== "approved") return null;

  request.notes = request.notes ? `${request.notes}\nRevoked by ${revokedBy}` : `Revoked by ${revokedBy}`;
  await applyRequestResolution(request, "revoked", revokedBy, request.notes, null);

  const user = await db.user.findByPk(request.userId);
  if (user) {
    user.elevatedUntil = null;
    await user.save();
  }

  return request;
};

breakGlassRequestDAO.expireOld = async () => {
  const now = new Date();
  const expired = await db.breakGlassRequest.findAll({
    where: {
      status: "approved",
      elevatedUntil: { [db.Sequelize.Op.lt]: now },
    },
  });

  for (const request of expired) {
    request.status = "expired";
    request.resolvedAt = now;
    await request.save();

    const user = await db.user.findByPk(request.userId);
    if (user && user.elevatedUntil && user.elevatedUntil < now) {
      user.elevatedUntil = null;
      await user.save();
    }
  }

  return expired;
};

module.exports = breakGlassRequestDAO;
