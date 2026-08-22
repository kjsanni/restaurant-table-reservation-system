"use strict";

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM compliance_evidence LIMIT 5`
    );

    if (!existing || existing.length === 0) {
      const now = new Date();
      const evidence = [
        {
          framework: "SOC2",
          controlId: "CC6.1",
          title: "Logical Access Controls",
          description: "Documented access control policies for platform admin and tenant users.",
          status: "completed",
          owner: "Platform Security",
          dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          evidenceUrl: "https://docs.vibespot.com/compliance/access-controls.pdf",
          notes: "Reviewed during Q2 audit.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "SOC2",
          controlId: "CC7.2",
          title: "Incident Response Plan",
          description: "Platform incident response and escalation procedures.",
          status: "completed",
          owner: "Platform Security",
          dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          evidenceUrl: "https://docs.vibespot.com/compliance/incident-response.pdf",
          notes: "Approved by CISO.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "ISO27001",
          controlId: "A.9.1",
          title: "Access Control Policy",
          description: "ISO 27001 aligned access control policy for multi-tenant SaaS.",
          status: "in_progress",
          owner: "Platform Security",
          dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
          evidenceUrl: null,
          notes: "Pending final review.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "GDPR",
          controlId: "Art.5",
          title: "Data Minimisation",
          description: "Evidence that tenant data collection is limited to necessary fields.",
          status: "completed",
          owner: "Data Protection Officer",
          dueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          evidenceUrl: "https://docs.vibespot.com/compliance/gdpr-data-minimisation.pdf",
          notes: "Verified by external counsel.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "DPA2012",
          controlId: "Sec.17",
          title: "Data Protection Safeguards",
          description: "Technical and organisational measures under Ghana DPA 2012.",
          status: "in_progress",
          owner: "Data Protection Officer",
          dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
          evidenceUrl: null,
          notes: "Gathering encryption key rotation logs.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "SOC2",
          controlId: "CC6.3",
          title: "Role-Based Access",
          description: "RBAC implementation for platform roles and tenant admins.",
          status: "completed",
          owner: "Platform Engineering",
          dueDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          evidenceUrl: "https://docs.vibespot.com/compliance/rbac.pdf",
          notes: "Automated via platform role management.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "ISO27001",
          controlId: "A.12.4",
          title: "Logging and Monitoring",
          description: "Audit logging, retention, and monitoring for admin actions.",
          status: "completed",
          owner: "Platform Engineering",
          dueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          evidenceUrl: "https://docs.vibespot.com/compliance/audit-logging.pdf",
          notes: "Winston + Sentry integration verified.",
          createdAt: now,
          updatedAt: now,
        },
        {
          framework: "GDPR",
          controlId: "Art.32",
          title: "Security of Processing",
          description: "Encryption at rest and in transit for tenant and customer data.",
          status: "in_progress",
          owner: "Platform Engineering",
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          evidenceUrl: null,
          notes: "Waiting for TLS certificate audit completion.",
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert("compliance_evidence", evidence);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("compliance_evidence", {
      framework: ["SOC2", "ISO27001", "GDPR", "DPA2012"],
    });
  },
};
