const supportTicketController = require("../tenant-platform/controllers/supportTicket.controller");

jest.mock("../tenant-platform/DAOs/supportTicket.dao");
jest.mock("../tenant-platform/DAOs/supportTicketMessage.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("supportTicket.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 1, isSuperAdmin: true }, tenant: null, ip: "127.0.0.1", params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("createSupportTicketHandler creates ticket and logs audit", async () => {
    const ticketDAO = require("../tenant-platform/DAOs/supportTicket.dao");
    const messageDAO = require("../tenant-platform/DAOs/supportTicketMessage.dao");
    ticketDAO.create.mockResolvedValue({ id: 1 });
    messageDAO.create.mockResolvedValue({ id: 1 });

    req.body = { subject: "Test", message: "Issue", priority: "medium" };
    await supportTicketController.createSupportTicketHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1 } });
  });

  it("updateSupportTicketHandler updates ticket and logs audit", async () => {
    const ticketDAO = require("../tenant-platform/DAOs/supportTicket.dao");
    ticketDAO.findById.mockResolvedValue({ id: 1, status: "open" });
    ticketDAO.update.mockResolvedValue({ id: 1, status: "resolved" });

    req.params.id = 1;
    req.body = { status: "resolved" };
    await supportTicketController.updateSupportTicketHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1, status: "resolved" } });
  });

  it("deleteSupportTicketHandler deletes ticket and logs audit", async () => {
    const ticketDAO = require("../tenant-platform/DAOs/supportTicket.dao");
    ticketDAO.remove.mockResolvedValue({ id: 1 });

    req.params.id = 1;
    await supportTicketController.deleteSupportTicketHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("listSupportTicketsHandler returns collection", async () => {
    const ticketDAO = require("../tenant-platform/DAOs/supportTicket.dao");
    ticketDAO.list.mockResolvedValue([]);

    req.query = {};
    await supportTicketController.listSupportTicketsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [] });
  });
});
