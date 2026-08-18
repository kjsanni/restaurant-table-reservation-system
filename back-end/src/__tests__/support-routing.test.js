jest.mock("../db/models", () => {
  const mockTicket = { id: 1, findByPk: jest.fn().mockResolvedValue({ id: 1, update: jest.fn() }), findAll: jest.fn().mockResolvedValue([]) };
  return {
    supportTicket: mockTicket,
    tenant: { findByPk: jest.fn().mockResolvedValue({ id: 1, name: "Test" }) },
  };
});

const SupportRouting = require("../tenant-platform/services/support-routing.service");

describe("Support Routing Service", () => {
  it("routes ticket to team", async () => {
    const result = await SupportRouting.routeTicket({ ticketId: 1, category: "technical", priority: "high" });
    expect(result).toHaveProperty("ticketId");
    expect(result).toHaveProperty("assignedTeam");
  });

  it("determines correct team", async () => {
    const team = await SupportRouting.determineTeam("billing", "low");
    expect(team).toHaveProperty("teamId");
    expect(team).toHaveProperty("name");
  });

  it("gets ticket queue", async () => {
    const queue = await SupportRouting.getTicketQueue(1);
    expect(Array.isArray(queue)).toBe(true);
  });
});
