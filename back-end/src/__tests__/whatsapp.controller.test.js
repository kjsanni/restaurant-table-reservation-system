jest.mock("../services/whatsapp-order.service");
jest.mock("../services/whatsapp.service");

const whatsappController = require("../controllers/whatsapp.controller");
const whatsappOrderService = require("../services/whatsapp-order.service");
const whatsappService = require("../services/whatsapp.service");

describe("whatsapp.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { headers: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    process.env.WHATSAPP_APP_SECRET = "test-secret";
    jest.clearAllMocks();
    whatsappService.verifyWebhookSignature.mockReturnValue(true);
    whatsappOrderService.processMessage.mockResolvedValue();
    whatsappOrderService.processLocationMessage.mockResolvedValue();
  });

  describe("verifyTokenHandler", () => {
    it("returns challenge when token matches", async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test-token";
      req.query = { "hub.mode": "subscribe", "hub.verify_token": "test-token", "hub.challenge": "12345" };

      await whatsappController.verifyTokenHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith("12345");
    });

    it("returns 403 when token does not match", async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test-token";
      req.query = { "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "12345" };

      await whatsappController.verifyTokenHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("inboundHandler", () => {
    const validHeaders = { "x-hub-signature-256": "valid-sig" };

    it("returns 503 when WHATSAPP_APP_SECRET is not set", async () => {
      delete process.env.WHATSAPP_APP_SECRET;
      req.body = { entry: [{ changes: [{ value: { messages: [] } }] }] };
      req.headers = {};

      await whatsappController.inboundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("returns 401 when signature is missing", async () => {
      req.body = { entry: [{ changes: [{ value: { messages: [] } }] }] };
      req.headers = {};

      await whatsappController.inboundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 200 for empty messages", async () => {
      req.body = { entry: [{ changes: [{ value: { messages: [] } }] }] };
      req.headers = validHeaders;

      await whatsappController.inboundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 200 for valid inbound text message", async () => {
      req.body = {
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: "123" },
                  messages: [
                    {
                      from: "+233241234567",
                      type: "text",
                      text: { body: "menu" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      req.headers = validHeaders;

      await whatsappController.inboundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("routes location messages to processLocationMessage", async () => {
      whatsappOrderService.processLocationMessage.mockResolvedValue();
      req.body = {
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: "123" },
                  messages: [
                    {
                      from: "+233241234567",
                      type: "location",
                      location: { latitude: 5.6037, longitude: -0.187, address: "Accra, Ghana" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      req.headers = validHeaders;

      await whatsappController.inboundHandler(req, res);
      expect(whatsappOrderService.processLocationMessage).toHaveBeenCalledWith(
        "+233241234567",
        { latitude: 5.6037, longitude: -0.187, address: "Accra, Ghana" },
        null
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("routes interactive button replies to processMessage", async () => {
      whatsappOrderService.processMessage.mockResolvedValue();
      req.body = {
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: "123" },
                  messages: [
                    {
                      from: "+233241234567",
                      type: "interactive",
                      interactive: {
                        type: "button_reply",
                        button_reply: { id: "1", title: "Make a reservation" },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      req.headers = validHeaders;

      await whatsappController.inboundHandler(req, res);
      expect(whatsappOrderService.processMessage).toHaveBeenCalledWith("+233241234567", "1", null);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
