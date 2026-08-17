"use strict";

const db = require("../../../db/models");
const passSigningRequestDAO = require("../../../tenant-platform/DAOs/passSigningRequest.dao");
const signedPassArtifactDAO = require("../../../tenant-platform/DAOs/signedPassArtifact.dao");
const { initializeCharge } = require("../../../tenant-platform/services/paystack.service");
const logger = require("../../../utils/logger");
const { normalizeSettingValue } = require("../../../utils/settings");
const { enqueueWalletPassSigning } = require("../../../queues/walletPass.queue");

const walletPassRequestController = {};

walletPassRequestController.createSigningRequest = async (req, res) => { // codacy-suppress method-length
  const { eventId } = req.params;
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!tenantId) {
    return res.status(403).json({ success: false, message: "Tenant context required" });
  }

  const event = await db.Event.findOne({ // codacy-suppress nosql-injection
    where: { id: eventId, tenantId },
  });

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  const designSetting = await db.setting.findOne({
    where: { tenantId, key: "wallet_pass_design" },
  });
  const design = designSetting ? normalizeSettingValue(designSetting.value) : {};

  if (!design || Object.keys(design).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Wallet pass design not configured. Set it in Settings → Wallet Pass Design first.",
    });
  }

  const priceSetting = await db.setting.findOne({
    where: { tenantId: null, key: "wallet_pass_signing_price" },
  });
  const price = priceSetting ? parseFloat(priceSetting.value) : 0;
  const currencySetting = await db.setting.findOne({
    where: { tenantId: null, key: "wallet_pass_signing_currency" },
  });
  const currency = currencySetting?.value || "GHS";

  if (!price || price <= 0) {
    return res.status(503).json({
      success: false,
      message: "Wallet pass signing service is not configured on the platform.",
    });
  }

  const designSnapshot = {
    design,
    ticketData: {
      eventId: event.id,
      eventName: event.name,
      venue: event.venue,
      eventDate: event.eventDate,
    },
  };

  const request = await passSigningRequestDAO.create({
    tenantId,
    eventId: event.id,
    requesterId: userId,
    designSnapshot,
    amount: price,
    currency,
  });

  try {
    const chargeResult = await initializeCharge({
      email: userEmail,
      amount: price,
      currency,
      metadata: {
        requestId: request.id,
        tenantId,
        eventId: event.id,
        custom_fields: [
          {
            display_name: "Wallet Pass Signing",
            variable_name: "request_id",
            value: String(request.id),
          },
        ],
      },
      channels: ["card", "mobile_money", "bank_transfer", "mtn_momo", "vodafone_cash", "airtel_tigo"],
    });

    await request.update({ paymentReference: chargeResult.reference || chargeResult.data?.reference });

    return res.status(202).json({
      success: true,
      requestId: request.id,
      status: "pending_payment",
      paymentUrl: chargeResult.authorization_url || chargeResult.data?.authorization_url,
      amount: price,
      currency,
      message: "Redirect to Paystack to complete payment. After payment, the request will be submitted for super-admin approval.",
    });
  } catch (payErr) {
    logger.error("Wallet pass payment initialization failed", {
      error: payErr.message,
      requestId: request.id,
      tenantId,
    });

    await request.update({ status: "failed" });

    return res.status(502).json({
      success: false,
      message: "Payment initialization failed. Please try again.",
      requestId: request.id,
    });
  }
};

walletPassRequestController.listRequests = async (req, res) => {
  const tenantId = req.tenant?.id;
  const filters = {
    status: req.query.status,
    limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200),
  };

  const requests = await passSigningRequestDAO.listByTenant(tenantId, filters);

  const serialized = requests.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    status: r.status,
    amount: parseFloat(r.amount || 0),
    currency: r.currency,
    paymentReference: r.paymentReference,
    platformStatuses: r.platformStatuses,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    completedAt: r.completedAt,
  }));

  return res.json({
    success: true,
    requests: serialized,
    count: serialized.length,
  });
};

walletPassRequestController.getRequest = async (req, res) => {
  const { requestId } = req.params;
  const tenantId = req.tenant?.id;

  const request = await passSigningRequestDAO.findById(requestId, tenantId);
  if (!request) {
    return res.status(404).json({ success: false, message: "Signing request not found" });
  }

  const artifacts = await signedPassArtifactDAO.listByRequest(request.id);

  return res.json({
    success: true,
    request: {
      id: request.id,
      eventId: request.eventId,
      status: request.status,
      amount: parseFloat(request.amount || 0),
      currency: request.currency,
      paymentReference: request.paymentReference,
      platformStatuses: request.platformStatuses,
      reviewNotes: request.reviewNotes,
      designSnapshot: request.designSnapshot,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      completedAt: request.completedAt,
    },
    artifacts: artifacts.map((a) => ({
      id: a.id,
      platform: a.platform,
      status: a.status,
      artifactType: a.artifactType,
      hasArtifact: !!a.artifactPath,
      error: a.error,
    })),
  });
};

walletPassRequestController.listPendingApproval = async (req, res) => {
  const filters = {
    tenantId:
      req.query.tenantId && !Number.isNaN(parseInt(req.query.tenantId, 10))
        ? parseInt(req.query.tenantId, 10)
        : null,
    limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200),
  };

  const requests = await passSigningRequestDAO.listPendingApproval(filters);

  return res.json({
    success: true,
    requests: requests.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      eventId: r.eventId,
      status: r.status,
      amount: parseFloat(r.amount || 0),
      currency: r.currency,
      paymentReference: r.paymentReference,
      requester: r.requester ? { id: r.requester.id, username: r.requester.username, email: r.requester.email } : null,
      createdAt: r.createdAt,
    })),
    count: requests.length,
  });
};

walletPassRequestController.approveRequest = async (req, res) => {
  const { requestId } = req.params;
  const reviewerId = req.user?.id;

  const existing = await passSigningRequestDAO.findById(requestId);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Signing request not found" });
  }

  if (existing.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot approve request in status: ${existing.status}. Expected: pending.`,
    });
  }

  try {
    const approved = await passSigningRequestDAO.approve(requestId, reviewerId, req.body.notes || null);

    const enqueueResult = await enqueueWalletPassSigning(approved.id, approved.tenantId);

    logger.info("Wallet pass signing request approved and queued", {
      requestId,
      tenantId: approved.tenantId,
      reviewerId,
      enqueued: enqueueResult.enqueued,
    });

    return res.json({
      success: true,
      requestId,
      status: "approved",
      enqueued: enqueueResult.enqueued,
      jobId: enqueueResult.jobId,
      message: enqueueResult.enqueued
        ? "Signing job enqueued. Artifacts will be available upon completion."
        : "Approval recorded, but signing job could not be enqueued (Redis unavailable). Will retry on next queue flush.",
    });
  } catch (err) {
    logger.error("Wallet pass approval failed", {
      error: err.message,
      requestId,
      reviewerId,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to approve signing request.",
    });
  }
};

walletPassRequestController.rejectRequest = async (req, res) => {
  const { requestId } = req.params;
  const reviewerId = req.user?.id;

  const existing = await passSigningRequestDAO.findById(requestId);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Signing request not found" });
  }

  if (existing.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot reject request in status: ${existing.status}. Expected: pending.`,
    });
  }

  const notes = req.body.notes || req.body.reason;
  if (!notes) {
    return res.status(400).json({ success: false, message: "Rejection notes are required" });
  }

  await passSigningRequestDAO.reject(requestId, reviewerId, notes);

  return res.json({
    success: true,
    requestId,
    status: "rejected",
    message: "Signing request rejected.",
  });
};

module.exports = walletPassRequestController;
