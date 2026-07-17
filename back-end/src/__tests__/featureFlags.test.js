const { requireFeatureFlag } = require("../utils/featureFlags");

jest.mock("../DAOs/auth.dao");
const authDAO = require("../DAOs/auth.dao");

describe("requireFeatureFlag", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes when flag is enabled", async () => {
    authDAO.getSettingValue.mockResolvedValue({ waitlist: true, loyalty: false, deposits: false });

    await expect(requireFeatureFlag("waitlist", "tenant-1")).resolves.toBeUndefined();
  });

  it("throws 403 when flag is disabled", async () => {
    authDAO.getSettingValue.mockResolvedValue({ waitlist: true, loyalty: false, deposits: false });

    await expect(requireFeatureFlag("loyalty", "tenant-1")).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("loyalty"),
    });
  });

  it("throws 403 when feature_flags setting is missing", async () => {
    authDAO.getSettingValue.mockResolvedValue(null);

    await expect(requireFeatureFlag("waitlist", "tenant-1")).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("waitlist"),
    });
  });
});
