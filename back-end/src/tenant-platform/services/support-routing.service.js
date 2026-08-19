"use strict";

const db = require("../../db/models");

const SupportRouting = {
  async routeTicket({ ticketId, tenantId, category, priority }) {
    const ticket = await db.supportTicket.findByPk(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const assignedTeam = await this.determineTeam(category, priority);

    await ticket.update({
      assignedTo: assignedTeam.teamId,
      status: "assigned",
    });

    return { ticketId, assignedTeam };
  },

  async determineTeam(category, priority) {
    const teams = {
      technical: { teamId: 1, name: "Technical Support", escalation: "L2" },
      billing: { teamId: 2, name: "Billing Support", escalation: "L1" },
      compliance: { teamId: 3, name: "Compliance Team", escalation: "L3" },
      general: { teamId: 4, name: "General Support", escalation: "L1" },
    };

    const team = teams[category] || teams.general;

    if (priority === "critical") {
      return { ...team, escalation: "L3" };
    }

    return team;
  },

  async getTicketQueue(teamId) {
    const tickets = await db.supportTicket.findAll({
      where: { assignedTo: teamId, status: ["open", "assigned"] },
      include: [{ model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] }],
      order: [["createdAt", "ASC"]],
    });

    return tickets;
  },
};

module.exports = SupportRouting;
