// Settings: value normalization + registration-status coercion
jest.mock("../db/models", () => {
  const Sequelize = { Op: {}, fn: jest.fn(), col: jest.fn() };
  const store = {};
  const make = (rows) => rows;
  return {
    sequelize: { transaction: jest.fn((fn) => fn({ update: jest.fn() })) },
    Sequelize,
    setting: {
      findOne: jest.fn(async ({ where }) => store[where.key] || null),
      findAll: jest.fn(async () => Object.values(store)),
      update: jest.fn(async (vals, { where }) => {
        if (store[where.key]) {
          store[where.key] = { ...store[where.key], value: vals.value };
          return [1];
        }
        return [0];
      }),
      create: jest.fn(async (row) => {
        store[row.key] = row;
        return row;
      }),
    },
    _store: store,
  };
});

const authDAO = require("../DAOs/auth.dao");
const authService = require("../services/authService");
const db = require("../db/models");
const store = db._store;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("updateSetting value normalization", () => {
  it("stores raw booleans (not stringified) so reads are consistent", async () => {
    await authDAO.updateSetting("customer_registration_enabled", true, 1);
    const read = await authDAO.getSettingByKey("customer_registration_enabled", 1);
    expect(read.value).toBe(true);
    expect(read.value).not.toBe("true");
  });

  it("coerces a stringified seed value on read", async () => {
    store["customer_registration_enabled"] = {
      key: "customer_registration_enabled",
      value: JSON.stringify(false),
    };
    const read = await authDAO.getSettingByKey("customer_registration_enabled", 1);
    expect(read.value).toBe(false);
  });
});

describe("checkRegistrationStatus", () => {
  it("returns enabled when setting is raw boolean true (post-update)", async () => {
    await authDAO.updateSetting("customer_registration_enabled", true, 1);
    const status = await authService.checkRegistrationStatus(authDAO, 1);
    expect(status.registrationEnabled).toBe(true);
  });

  it("returns disabled when setting is raw boolean false (post-update)", async () => {
    await authDAO.updateSetting("customer_registration_enabled", false, 1);
    const status = await authService.checkRegistrationStatus(authDAO, 1);
    expect(status.registrationEnabled).toBe(false);
  });

  it("returns enabled by default when no setting exists", async () => {
    const status = await authService.checkRegistrationStatus(authDAO, 1);
    expect(status.registrationEnabled).toBe(true);
  });
});
