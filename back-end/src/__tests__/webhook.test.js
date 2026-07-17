const webhookService = require("../services/webhook.service");

jest.mock("../DAOs/auth.dao");
jest.mock("axios");

const authDAO = require("../DAOs/auth.dao");
const axios = require("axios");

describe("webhookService.dispatch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing when webhooks are disabled", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: false, subscriptions: [] });

    await webhookService.dispatch("reservation.created", { id: 1 }, "tenant-1");

    expect(authDAO.getSettingValue).toHaveBeenCalledWith("webhooks", expect.any(Object), "tenant-1");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("does nothing when no subscriptions match the event", async () => {
    authDAO.getSettingValue.mockResolvedValue({
      enabled: true,
      subscriptions: [{ url: "https://example.com/a", events: ["payment.completed"], active: true }],
    });

    await webhookService.dispatch("reservation.created", { id: 1 }, "tenant-1");

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("dispatches to matching active subscriptions", async () => {
    axios.post.mockResolvedValue({ status: 200 });
    authDAO.getSettingValue.mockResolvedValue({
      enabled: true,
      subscriptions: [
        { url: "https://example.com/a", events: ["reservation.created"], active: true },
        { url: "https://example.com/b", events: ["reservation.created", "payment.completed"], active: true },
      ],
    });

    await webhookService.dispatch("reservation.created", { id: 1 }, "tenant-1");

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledWith(
      "https://example.com/a",
      expect.objectContaining({ event: "reservation.created" }),
      expect.objectContaining({ timeout: 5000 })
    );
    expect(axios.post).toHaveBeenCalledWith(
      "https://example.com/b",
      expect.objectContaining({ event: "reservation.created" }),
      expect.objectContaining({ timeout: 5000 })
    );
  });

  it("skips inactive subscriptions", async () => {
    axios.post.mockResolvedValue({ status: 200 });
    authDAO.getSettingValue.mockResolvedValue({
      enabled: true,
      subscriptions: [
        { url: "https://example.com/a", events: ["reservation.created"], active: false },
      ],
    });

    await webhookService.dispatch("reservation.created", { id: 1 }, "tenant-1");

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("handles network failures gracefully", async () => {
    axios.post.mockRejectedValue(new Error("Network error"));
    authDAO.getSettingValue.mockResolvedValue({
      enabled: true,
      subscriptions: [{ url: "https://example.com/a", events: ["reservation.created"], active: true }],
    });

    await expect(webhookService.dispatch("reservation.created", { id: 1 }, "tenant-1")).resolves.toBeUndefined();
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
