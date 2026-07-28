const { getBySlugHandler } = require("../tenant-platform/controllers/publicTenant.controller");

jest.mock("../db/models", () => ({
  tenant: {
    findOne: jest.fn(),
  },
}));

const db = require("../db/models");

function createReq(params = {}) {
  return { params };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("publicTenant.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when slug is missing", async () => {
    const req = createReq({});
    const res = createRes();
    await getBySlugHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("sanitizes settings to only expose branding on public endpoint", async () => {
    db.tenant.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 1,
        name: "Test",
        slug: "test",
        settings: {
          branding: { primaryColor: "#fff" },
          paystackSecret: "SECRET",
          webhookSecret: "SECRET",
        },
      }),
    });
    const req = createReq({ slug: "test" });
    const res = createRes();
    await getBySlugHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.item.settings).toEqual({ branding: { primaryColor: "#fff" } });
    expect(jsonArg.item.settings.paystackSecret).toBeUndefined();
    expect(jsonArg.item.settings.webhookSecret).toBeUndefined();
  });

  it("returns null settings when tenant has none", async () => {
    db.tenant.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 1,
        name: "Test",
        slug: "test",
        settings: null,
      }),
    });
    const req = createReq({ slug: "test" });
    const res = createRes();
    await getBySlugHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.item.settings).toBeNull();
  });
});
