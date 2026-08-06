const { listListingsHandler, createListingHandler, updateListingHandler, removeListingHandler } = require("../tenant-platform/controllers/marketplace.controller");

jest.mock("../tenant-platform/DAOs/marketplace.dao", () => ({
  listListings: jest.fn(),
  createListing: jest.fn(),
  updateListing: jest.fn(),
  removeListing: jest.fn(),
}));

const marketplaceDAO = require("../tenant-platform/DAOs/marketplace.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, ip: "127.0.0.1" };
}

describe("marketplace.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create accepts whitelisted fields and strips non-whitelisted fields", async () => {
    marketplaceDAO.createListing.mockResolvedValue({ id: 1, title: "Test" });
    const req = createReq({ id: 1 }, { title: "Test", description: "Desc", position: 1, isActive: true, maliciousField: "ignored" });
    const res = createRes();
    await createListingHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(marketplaceDAO.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test", description: "Desc", position: 1, isActive: true })
    );
    expect(marketplaceDAO.createListing).toHaveBeenCalledWith(
      expect.not.objectContaining({ maliciousField: "ignored" })
    );
  });

  it("update accepts whitelisted fields and strips non-whitelisted fields", async () => {
    marketplaceDAO.updateListing.mockResolvedValue({ id: 1, title: "Updated" });
    const req = createReq({ id: 1 }, { title: "Updated", position: 2, maliciousField: "ignored" }, { id: "1" });
    const res = createRes();
    await updateListingHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(marketplaceDAO.updateListing).toHaveBeenCalledWith("1", expect.objectContaining({ title: "Updated", position: 2 }));
    expect(marketplaceDAO.updateListing).toHaveBeenCalledWith("1", expect.not.objectContaining({ maliciousField: "ignored" }));
  });

  it("update returns 404 when not found", async () => {
    marketplaceDAO.updateListing.mockResolvedValue(null);
    const req = createReq({ id: 1 }, { title: "Updated" }, { id: "999" });
    const res = createRes();
    await updateListingHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("remove returns 404 when not found", async () => {
    marketplaceDAO.removeListing.mockReturnValue(false);
    const req = createReq({ id: 1 }, {}, { id: "999" });
    const res = createRes();
    await removeListingHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
