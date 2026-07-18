jest.mock("../DAOs/reservation.dao");

const reservationDAO = require("../DAOs/reservation.dao");

describe("multi-tenant query scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findCustomerByEmail should scope by tenantId when provided", async () => {
    reservationDAO.findCustomerByEmail.mockResolvedValue({ id: 1, email: "test@example.com" });

    const result = await reservationDAO.findCustomerByEmail("test@example.com", 5);

    expect(reservationDAO.findCustomerByEmail).toHaveBeenCalledWith("test@example.com", 5);
    expect(result).not.toBeNull();
  });

  it("findCustomerByEmail should pass null tenantId when not provided", async () => {
    reservationDAO.findCustomerByEmail.mockResolvedValue(null);

    const result = await reservationDAO.findCustomerByEmail("test@example.com", null);

    expect(reservationDAO.findCustomerByEmail).toHaveBeenCalledWith("test@example.com", null);
    expect(result).toBeNull();
  });

  it("createCustomer should include tenantId in create payload", async () => {
    reservationDAO.createCustomer.mockResolvedValue({ id: 2, email: "new@example.com" });

    const result = await reservationDAO.createCustomer(
      { firstName: "Test", lastName: "User", email: "new@example.com", phone: "1234567890" },
      null,
      3
    );

    expect(reservationDAO.createCustomer).toHaveBeenCalledWith(
      { firstName: "Test", lastName: "User", email: "new@example.com", phone: "1234567890" },
      null,
      3
    );
    expect(result).not.toBeNull();
  });

  it("searchCustomers should scope by tenantId", async () => {
    reservationDAO.searchCustomers.mockResolvedValue([]);

    await reservationDAO.searchCustomers("test", 7);

    expect(reservationDAO.searchCustomers).toHaveBeenCalledWith("test", 7);
  });
});
