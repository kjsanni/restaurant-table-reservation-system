"use strict";

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const { applyTypeDefaults, seedSalonSettings, seedEventSettings } = require("../services/tenantTypeDefaults.service");
const onboardingDAO = require("../DAOs/onboarding.dao");
const provisioningPipelineDAO = require("../DAOs/provisioningPipeline.dao");

const STEPS = [
  {
    key: "seed_type_defaults",
    label: "Seed type defaults",
    run: async (tenant) => {
      applyTypeDefaults(tenant, tenant.restaurantType || "full_service");
      await tenant.save();
    },
    rollback: async (tenant) => {
      tenant.settings = tenant.settings || {};
      tenant.settings.featureFlags = {};
      await tenant.save();
    },
  },
  {
    key: "seed_specialized_settings",
    label: "Seed specialized settings",
    run: async (tenant) => {
      if (tenant.businessVertical === "salon") {
        await seedSalonSettings(tenant.id);
      } else if (tenant.businessVertical === "event") {
        await seedEventSettings(tenant.id);
      }
    },
    rollback: async () => {},
  },
  {
    key: "seed_salon_service_categories",
    label: "Seed salon service categories",
    run: async (tenant) => {
      if (tenant.businessVertical !== "salon") return;
      const existing = await db.serviceCategory.count({ where: { tenantId: tenant.id } });
      if (existing > 0) return;
      const defaults = [
        { name: "Hair", sortOrder: 0 },
        { name: "Nails", sortOrder: 1 },
        { name: "Skincare", sortOrder: 2 },
        { name: "Massage", sortOrder: 3 },
      ];
      for (const cat of defaults) {
        await db.serviceCategory.create({ ...cat, tenantId: tenant.id });
      }
    },
    rollback: async (tenant) => {
      await db.serviceCategory.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "seed_default_services",
    label: "Seed default services",
    run: async (tenant) => {
      if (tenant.businessVertical !== "salon") return;
      const existing = await db.service.count({ where: { tenantId: tenant.id } });
      if (existing > 0) return;
      const categories = await db.serviceCategory.findAll({ where: { tenantId: tenant.id }, attributes: ["id", "name"] });
      const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
      const defaults = [
        { name: "Men's Haircut", categoryName: "Hair", price: 50, durationMinutes: 30 },
        { name: "Women's Haircut", categoryName: "Hair", price: 80, durationMinutes: 45 },
        { name: "Manicure", categoryName: "Nails", price: 40, durationMinutes: 30 },
        { name: "Pedicure", categoryName: "Nails", price: 60, durationMinutes: 45 },
        { name: "Facial", categoryName: "Skincare", price: 100, durationMinutes: 60 },
        { name: "Full Body Massage", categoryName: "Massage", price: 150, durationMinutes: 60 },
      ];
      for (const s of defaults) {
        const categoryId = catMap[s.categoryName];
        if (!categoryId) continue;
        await db.service.create({
          tenantId: tenant.id,
          categoryId,
          name: s.name,
          price: s.price,
          durationMinutes: s.durationMinutes,
          isAvailable: true,
          whatsappBookable: true,
        });
      }
    },
    rollback: async (tenant) => {
      await db.service.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "seed_default_locations",
    label: "Seed default locations",
    run: async (tenant) => {
      if (tenant.businessVertical !== "salon") return;
      const existing = await db.location.count({ where: { tenantId: tenant.id } });
      if (existing > 0) return;
      await db.location.create({
        tenantId: tenant.id,
        name: "Main Salon",
        address: "",
        city: "",
        region: "",
        phone: tenant.phone || "",
        email: tenant.email || "",
        isPrimary: true,
        isActive: true,
        timezone: "Africa/Accra",
        currency: tenant.currency || "GHS",
      });
    },
    rollback: async (tenant) => {
      await db.location.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "initialize_feature_flags",
    label: "Initialize feature flags",
    run: async (tenant) => {
      const settings = tenant.settings || {};
      settings.featureFlags = { ...(settings.featureFlags || {}) };
      await tenant.update({ settings });
    },
    rollback: async () => {},
  },
  {
    key: "initialize_white_label",
    label: "Initialize white-label",
    run: async (tenant) => {
      const settings = tenant.settings || {};
      settings.whiteLabel = settings.whiteLabel || {
        enabled: false,
        brandName: tenant.name,
        primaryColor: "#1976D2",
        logoUrl: null,
        customDomain: null,
      };
      await tenant.update({ settings });
    },
    rollback: async () => {},
  },
  {
    key: "initialize_notifications",
    label: "Initialize notifications",
    run: async (tenant) => {
      const defaultTemplates = [
        { key: "reservation_confirmed", channel: "email", enabled: true },
        { key: "reservation_reminder", channel: "email", enabled: true },
        { key: "reservation_cancelled", channel: "email", enabled: true },
        { key: "payment_receipt", channel: "email", enabled: true },
        { key: "reservation_confirmed", channel: "sms", enabled: false },
        { key: "reservation_reminder", channel: "sms", enabled: false },
        { key: "whatsapp_booking_confirmation", channel: "whatsapp", enabled: false },
        { key: "whatsapp_reservation_reminder", channel: "whatsapp", enabled: false },
      ];
      for (const tmpl of defaultTemplates) {
        await db.notificationTemplate.findOrCreate({
          where: { tenantId: tenant.id, key: tmpl.key, channel: tmpl.channel },
          defaults: { tenantId: tenant.id, key: tmpl.key, channel: tmpl.channel, enabled: tmpl.enabled },
        });
      }
    },
    rollback: async (tenant) => {
      await db.notificationTemplate.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "create_default_tables",
    label: "Create default tables",
    run: async (tenant) => {
      if (tenant.businessVertical !== "restaurant") return;
      const existing = await db.table.count({ where: { tenantId: tenant.id } });
      if (existing > 0) return;
      const defaults = [
        { name: "Table 1", capacity: 2, location: "indoor" },
        { name: "Table 2", capacity: 2, location: "indoor" },
        { name: "Table 3", capacity: 4, location: "indoor" },
        { name: "Table 4", capacity: 4, location: "indoor" },
        { name: "Table 5", capacity: 6, location: "indoor" },
        { name: "Table 6", capacity: 8, location: "indoor" },
        { name: "Patio 1", capacity: 4, location: "outdoor" },
        { name: "Patio 2", capacity: 6, location: "outdoor" },
      ];
      for (const t of defaults) {
        await db.table.create({ ...t, tenantId: tenant.id, isActive: true });
      }
    },
    rollback: async (tenant) => {
      await db.table.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "initialize_payment_config",
    label: "Initialize payment config",
    run: async (tenant) => {
      const settings = tenant.settings || {};
      settings.paymentConfig = settings.paymentConfig || {
        gateway: "platform",
        currency: tenant.currency || "GHS",
        enabledChannels: ["card_paystack", "mobile_money"],
        depositRequired: false,
        defaultDepositPercent: 0,
      };
      await tenant.update({ settings });
    },
    rollback: async () => {},
  },
  {
    key: "initialize_whatsapp_config",
    label: "Initialize WhatsApp config",
    run: async (tenant) => {
      const settings = tenant.settings || {};
      settings.whatsappConfig = settings.whatsappConfig || {
        enabled: false,
        phoneNumberId: "",
        token: "",
        businessNumber: "",
      };
      await tenant.update({ settings });
    },
    rollback: async () => {},
  },
  {
    key: "initialize_erpnext_settings",
    label: "Initialize ERPNext settings",
    run: async (tenant) => {
      const settings = tenant.settings || {};
      const featureFlags = settings.featureFlags || {};
      const hasErpnext = Object.keys(featureFlags).some((k) => k.startsWith("erpnext_") && featureFlags[k]);
      if (!hasErpnext) return;

      settings.erpnextOnboardingStatus = settings.erpnextOnboardingStatus || {
        company: "pending",
        warehouse: "pending",
        employeeImport: "pending",
      };
      settings.erpnextConfig = settings.erpnextConfig || {
        enabled: true,
        modules: Object.keys(featureFlags).filter((k) => k.startsWith("erpnext_") && featureFlags[k]),
        lastSyncAt: null,
      };
      await tenant.update({ settings });
    },
    rollback: async (tenant) => {
      const settings = tenant.settings || {};
      delete settings.erpnextOnboardingStatus;
      delete settings.erpnextConfig;
      await tenant.update({ settings });
    },
  },
  {
    key: "seed_default_menu_categories",
    label: "Seed default menu categories",
    run: async (tenant) => {
      if (tenant.businessVertical !== "restaurant") return;
      const existing = await db.menuCategory.count({ where: { tenantId: tenant.id } });
      if (existing > 0) return;
      const defaults = [
        { name: "Starters", description: "Light bites and appetizers", sortOrder: 0 },
        { name: "Mains", description: "Main courses", sortOrder: 1 },
        { name: "Drinks", description: "Hot and cold beverages", sortOrder: 2 },
      ];
      for (const cat of defaults) {
        await db.menuCategory.create({ ...cat, tenantId: tenant.id });
      }
    },
    rollback: async (tenant) => {
      await db.menuCategory.destroy({ where: { tenantId: tenant.id } });
    },
  },
  {
    key: "complete_onboarding",
    label: "Complete onboarding",
    run: async (tenant) => {
      await onboardingDAO.complete(tenant.id);
    },
    rollback: async () => {},
  },
  {
    key: "activate_tenant",
    label: "Activate tenant",
    run: async (tenant) => {
      if (tenant.status === "trialing") {
        await tenant.update({ status: "active" });
      }
    },
    rollback: async (tenant) => {
      if (tenant.status === "active") {
        await tenant.update({ status: "trialing" });
      }
    },
  },
];

const createPipeline = async (tenantId, actorUserId) => {
  const pipeline = {
    tenantId,
    actorUserId,
    status: "running",
    currentStepIndex: 0,
    steps: STEPS.map((s) => ({ key: s.key, label: s.label, status: "pending", error: null })),
    startedAt: new Date(),
    completedAt: null,
  };
  try {
    await provisioningPipelineDAO.upsert(pipeline);
  } catch (err) {
    console.error("Failed to persist provisioning pipeline", err);
  }
  return pipeline;
};

const getPipeline = async (tenantId) => {
  try {
    const persisted = await provisioningPipelineDAO.findByTenantId(tenantId);
    if (persisted) {
      return persisted.toJSON();
    }
  } catch (err) {
    console.error("Failed to load provisioning pipeline", err);
  }
  return null;
};

const updateStepStatus = async (pipeline, stepIndex, status, error = null) => {
  if (pipeline.steps[stepIndex]) {
    pipeline.steps[stepIndex] = { ...pipeline.steps[stepIndex], status, error };
  }
  try {
    await provisioningPipelineDAO.upsert(pipeline);
  } catch (err) {
    console.error("Failed to persist pipeline step update", err);
  }
};

const runStep = async (pipeline, stepIndex, tenant) => {
  const step = STEPS[stepIndex];
  if (!step) return;

  updateStepStatus(pipeline, stepIndex, "running");
  try {
    await step.run(tenant);
    updateStepStatus(pipeline, stepIndex, "completed");
  } catch (err) {
    updateStepStatus(pipeline, stepIndex, "failed", err.message);
    pipeline.status = "failed";
    pipeline.error = err.message;
    throw err;
  }
};

const rollbackStep = async (pipeline, stepIndex, tenant) => {
  const step = STEPS[stepIndex];
  if (!step) return;

  try {
    await step.rollback(tenant);
    updateStepStatus(pipeline, stepIndex, "rolled_back");
  } catch (err) {
    updateStepStatus(pipeline, stepIndex, "rollback_failed", err.message);
  }
};

const validateTenant = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    const err = new Error("Tenant not found");
    err.status = 404;
    throw err;
  }
  return tenant;
};

const executeProvisioningSteps = async (pipeline, tenant, startIndex, tenantId, actorUserId) => {
  for (let i = startIndex; i < STEPS.length; i++) {
    pipeline.currentStepIndex = i;
    if (pipeline.status === "paused") {
      return { paused: true };
    }
    try {
      await runStep(pipeline, i, tenant);
    } catch (err) {
      await rollbackAll(pipeline, tenant);
      pipeline.status = "failed";
      pipeline.error = err.message;
      await provisioningPipelineDAO.upsert(pipeline);
      await platformAuditDAO.log(
        actorUserId, "provisioning.failed", "tenant", tenantId, tenantId,
        { step: STEPS[i].key, error: err.message }, null
      );
      return { failed: true, err };
    }
  }
  return { completed: true };
};

const finalizeProvisioning = async (pipeline, actorUserId, tenantId) => {
  if (pipeline.status === "paused") {
    await provisioningPipelineDAO.upsert(pipeline);
    await platformAuditDAO.log(
      actorUserId, "provisioning.paused", "tenant", tenantId, tenantId,
      { currentStep: STEPS[pipeline.currentStepIndex]?.key }, null
    );
    return;
  }

  pipeline.status = "completed";
  pipeline.completedAt = new Date();
  await provisioningPipelineDAO.upsert(pipeline);
  await platformAuditDAO.log(
    actorUserId, "provisioning.completed", "tenant", tenantId, tenantId,
    { durationMs: pipeline.completedAt - pipeline.startedAt }, null
  );
};

const startProvisioning = async (tenantId, actorUserId = null) => {
  const tenant = await validateTenant(tenantId);

  let pipeline = await getPipeline(tenantId);
  if (!pipeline) {
    pipeline = await createPipeline(tenantId, actorUserId);
  }

  if (pipeline.status === "running") {
    const err = new Error("Provisioning is already running");
    err.status = 409;
    throw err;
  }

  if (pipeline.status === "completed") {
    const err = new Error("Provisioning already completed");
    err.status = 409;
    throw err;
  }

  pipeline.status = "running";
  pipeline.startedAt = new Date();
  pipeline.completedAt = null;
  pipeline.error = null;

  for (let i = 0; i < STEPS.length; i++) {
    pipeline.currentStepIndex = i;
    await updateStepStatus(pipeline, i, "pending");
  }

  const result = await executeProvisioningSteps(pipeline, tenant, 0, tenantId, actorUserId);
  if (result.failed) return pipeline;

  await finalizeProvisioning(pipeline, actorUserId, tenantId);
  return pipeline;
};

const pauseProvisioning = async (tenantId, actorUserId = null) => {
  const pipeline = await getPipeline(tenantId);
  if (!pipeline || pipeline.status !== "running") {
    const err = new Error("No running provisioning to pause");
    err.status = 409;
    throw err;
  }

  pipeline.status = "paused";
  await provisioningPipelineDAO.upsert(pipeline);
  await platformAuditDAO.log(
    actorUserId,
    "provisioning.paused",
    "tenant",
    tenantId,
    tenantId,
    { currentStep: STEPS[pipeline.currentStepIndex]?.key },
    null
  );
  return pipeline;
};

const resumeProvisioning = async (tenantId, actorUserId = null) => {
  const pipeline = await getPipeline(tenantId);
  if (!pipeline || pipeline.status !== "paused") {
    const err = new Error("No paused provisioning to resume");
    err.status = 409;
    throw err;
  }

  const tenant = await validateTenant(tenantId);
  pipeline.status = "running";

  const result = await executeProvisioningSteps(
    pipeline, tenant, pipeline.currentStepIndex, tenantId, actorUserId
  );
  if (result.failed) return pipeline;

  await finalizeProvisioning(pipeline, actorUserId, tenantId);
  return pipeline;
};

const rollbackAll = async (pipeline, tenant) => {
  for (let i = pipeline.currentStepIndex; i >= 0; i--) {
    if (pipeline.steps[i].status === "completed") {
      await rollbackStep(pipeline, i, tenant);
    }
  }
};

const rollbackProvisioning = async (tenantId, actorUserId = null) => {
  const pipeline = await getPipeline(tenantId);
  if (!pipeline) {
    const err = new Error("Provisioning not found");
    err.status = 404;
    throw err;
  }

  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    const err = new Error("Tenant not found");
    err.status = 404;
    throw err;
  }

  await rollbackAll(pipeline, tenant);
  pipeline.status = "rolled_back";
  pipeline.completedAt = new Date();
  await provisioningPipelineDAO.upsert(pipeline);
  await platformAuditDAO.log(
    actorUserId,
    "provisioning.rolled_back",
    "tenant",
    tenantId,
    tenantId,
    { rolledBackSteps: pipeline.steps.filter((s) => s.status === "rolled_back").map((s) => s.key) },
    null
  );
  return pipeline;
};

const getProvisioningStatus = async (tenantId) => {
  const pipeline = await getPipeline(tenantId);
  if (!pipeline) return null;
  return {
    tenantId: pipeline.tenantId,
    status: pipeline.status,
    currentStepIndex: pipeline.currentStepIndex,
    steps: pipeline.steps.map((s) => ({ key: s.key, label: s.label, status: s.status, error: s.error })),
    startedAt: pipeline.startedAt,
    completedAt: pipeline.completedAt,
    error: pipeline.error,
  };
};

const getDLQStatus = async (tenantId, limit = 50) => {
  const auditDAO = require("../DAOs/platformAudit.dao");
  const dlqEntries = await auditDAO.list({
    action: "provisioning.dlq_moved",
    tenantId,
    limit,
    offset: 0,
  });

  return dlqEntries.map((entry) => ({
    jobId: entry.entityId,
    failedReason: entry.metadata?.failedReason || "unknown",
    attemptsMade: entry.metadata?.attemptsMade || 0,
    failedAt: entry.createdAt,
    data: entry.metadata?.originalJobData || null,
  }));
};

const retryDLQEntry = async (jobId, actorUserId) => {
  const { enqueueProvisioning } = require("../../queues/provisioning.queue");
  const auditDAO = require("../DAOs/platformAudit.dao");
  const entries = await auditDAO.list({
    action: "provisioning.dlq_moved",
    limit: 100,
  });

  const entry = entries.find((e) => e.entityId == jobId);
  if (!entry) {
    const err = new Error("DLQ entry not found");
    err.status = 404;
    throw err;
  }

  const tenantId = entry.tenantId;
  const initiatedBy = actorUserId || entry.actorUserId;
  const result = await enqueueProvisioning(tenantId, initiatedBy);

  await auditDAO.log(
    actorUserId,
    "provisioning.dlq_retried",
    "provisioning_dlq",
    jobId,
    tenantId,
    { originalEntryId: entry.id, retriedAt: new Date().toISOString() },
    null
  );

  return { jobId: result.jobId, enqueued: result.enqueued, tenantId };
};

module.exports = {
  STEPS,
  startProvisioning,
  pauseProvisioning,
  resumeProvisioning,
  rollbackProvisioning,
  getProvisioningStatus,
  getDLQStatus,
  retryDLQEntry,
};
