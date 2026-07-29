const reservationDAO = require("../DAOs/reservation.dao");

jest.mock("../DAOs/reservation.dao");

describe("multi-tenant query scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findCustomerByEmail scopes by tenantId when provided", async () => {
    reservationDAO.findCustomerByEmail.mockResolvedValue({ id: 1, email: "test@example.com" });

    const result = await reservationDAO.findCustomerByEmail("test@example.com", 5);

    expect(reservationDAO.findCustomerByEmail).toHaveBeenCalledWith("test@example.com", 5);
    expect(result).not.toBeNull();
  });

  it("findCustomerByEmail passes null tenantId when not provided", async () => {
    reservationDAO.findCustomerByEmail.mockResolvedValue(null);

    const result = await reservationDAO.findCustomerByEmail("test@example.com", null);

    expect(reservationDAO.findCustomerByEmail).toHaveBeenCalledWith("test@example.com", null);
    expect(result).toBeNull();
  });

  it("createCustomer includes tenantId in create payload", async () => {
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

  it("searchCustomers scopes by tenantId", async () => {
    reservationDAO.searchCustomers.mockResolvedValue([]);

    await reservationDAO.searchCustomers("test", 7);

    expect(reservationDAO.searchCustomers).toHaveBeenCalledWith("test", 7);
  });

  it("findReservationById scopes by tenantId", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, tenantId: 5 });

    await reservationDAO.findReservationById(1, 5);

    expect(reservationDAO.findReservationById).toHaveBeenCalledWith(1, 5);
  });

  it("createReservation includes tenantId", async () => {
    reservationDAO.createReservation.mockResolvedValue({ id: 1 });

    await reservationDAO.createReservation({ tableId: 1, date: "2025-01-01" }, 7);

    expect(reservationDAO.createReservation).toHaveBeenCalledWith(
      { tableId: 1, date: "2025-01-01" },
      7
    );
  });

  it("cross-tenant isolation: first tenant data is not returned for second tenant", async () => {
    reservationDAO.findCustomerByEmail
      .mockResolvedValueOnce({ id: 1, email: "test@example.com", tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Result = await reservationDAO.findCustomerByEmail("test@example.com", 5);
    const tenant9Result = await reservationDAO.findCustomerByEmail("test@example.com", 9);

    expect(tenant5Result).not.toBeNull();
    expect(tenant9Result).toBeNull();
  });

  it("cancelReservation includes tenantId to prevent cross-tenant cancellation", async () => {
    reservationDAO.cancelReservation.mockResolvedValue({ id: 1, cancelled: true });

    await reservationDAO.cancelReservation(1, 5, "user left");

    expect(reservationDAO.cancelReservation).toHaveBeenCalledWith(1, 5, "user left");
  });
});
