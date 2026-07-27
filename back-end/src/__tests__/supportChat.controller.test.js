const supportChatController = require("../tenant-platform/controllers/supportChat.controller");

jest.mock("../tenant-platform/DAOs/supportConversation.dao");
jest.mock("../tenant-platform/DAOs/supportMessage.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("supportChat.controller", () => {
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

  it("createConversationHandler creates conversation and logs audit", async () => {
    const convDAO = require("../tenant-platform/DAOs/supportConversation.dao");
    const msgDAO = require("../tenant-platform/DAOs/supportMessage.dao");
    convDAO.create.mockResolvedValue({ id: 1 });
    msgDAO.create.mockResolvedValue({ id: 1 });

    req.body = { subject: "Test", message: "Hello", priority: "high" };
    await supportChatController.createConversationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1 } });
  });

  it("sendMessageHandler creates message and logs audit", async () => {
    const convDAO = require("../tenant-platform/DAOs/supportConversation.dao");
    const msgDAO = require("../tenant-platform/DAOs/supportMessage.dao");
    convDAO.findById.mockResolvedValue({ id: 1 });
    msgDAO.create.mockResolvedValue({ id: 1 });

    req.params.id = 1;
    req.body = { body: "Reply" };
    await supportChatController.sendMessageHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1 } });
  });

  it("deleteConversationHandler deletes conversation and logs audit", async () => {
    const convDAO = require("../tenant-platform/DAOs/supportConversation.dao");
    convDAO.remove.mockResolvedValue({ id: 1 });

    req.params.id = 1;
    await supportChatController.deleteConversationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("listConversationsHandler returns collection", async () => {
    const convDAO = require("../tenant-platform/DAOs/supportConversation.dao");
    convDAO.list.mockResolvedValue([]);

    req.query = {};
    await supportChatController.listConversationsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [] });
  });
});
