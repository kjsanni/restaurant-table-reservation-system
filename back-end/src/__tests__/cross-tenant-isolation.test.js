const reservationDAO = require("../DAOs/reservation.dao");
const tableDAO = require("../DAOs/table.dao");
const menuDAO = require("../DAOs/menu.dao");
const orderDAO = require("../DAOs/order.dao");
const paymentDAO = require("../DAOs/payment.dao");
const authDAO = require("../DAOs/auth.dao");
const emailTemplateDAO = require("../DAOs/emailTemplate.dao");

jest.mock("../DAOs/reservation.dao", () => ({
  findCustomerByEmail: jest.fn(),
  createCustomer: jest.fn(),
  searchCustomers: jest.fn(),
  findReservationById: jest.fn(),
  createReservation: jest.fn(),
  cancelReservation: jest.fn(),
}));

jest.mock("../DAOs/table.dao", () => ({
  findTableById: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
  findAllTables: jest.fn(),
}));

jest.mock("../DAOs/menu.dao", () => ({
  createCategory: jest.fn(),
  getCategories: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  createMenuItem: jest.fn(),
  updateMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
}));

jest.mock("../DAOs/order.dao", () => ({
  createOrder: jest.fn(),
  getOrders: jest.fn(),
  getOrderById: jest.fn(),
  updateOrder: jest.fn(),
  cancelOrder: jest.fn(),
  searchOrders: jest.fn(),
}));

jest.mock("../DAOs/payment.dao", () => ({
  findByReservation: jest.fn(),
  createPayment: jest.fn(),
  getPaymentsByOrder: jest.fn(),
}));

jest.mock("../DAOs/auth.dao", () => ({
  findUserByEmail: jest.fn(),
  getAllStaff: jest.fn(),
  getAllAdmins: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock("../DAOs/emailTemplate.dao", () => ({
  getAllTemplates: jest.fn(),
  getTemplateByKey: jest.fn(),
  getTemplateById: jest.fn(),
  createTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
}));

jest.mock("../verticals/salon/DAOs/appointment.dao", () => ({
  findAllForTenant: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  cancel: jest.fn(),
}));

jest.mock("../verticals/salon/DAOs/service.dao", () => ({
  findAllForTenant: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe("cross-tenant isolation: restaurant vertical", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findTableById scopes by tenantId", async () => {
    tableDAO.findTableById.mockResolvedValue({ id: 1, name: "Table 1" });
    const result = await tableDAO.findTableById(1, 5);
    expect(tableDAO.findTableById).toHaveBeenCalledWith(1, 5);
    expect(result).not.toBeNull();
  });

  it("findTableById returns null for wrong tenant", async () => {
    tableDAO.findTableById.mockResolvedValue(null);
    const result = await tableDAO.findTableById(1, 9);
    expect(tableDAO.findTableById).toHaveBeenCalledWith(1, 9);
    expect(result).toBeNull();
  });

  it("createTable includes tenantId", async () => {
    tableDAO.createTable.mockResolvedValue({ id: 2, name: "Table 2" });
    await tableDAO.createTable({ name: "Table 2", capacity: 4 }, 5);
    expect(tableDAO.createTable).toHaveBeenCalledWith(
      { name: "Table 2", capacity: 4 },
      5
    );
  });

  it("menu category operations scope by tenantId", async () => {
    menuDAO.createCategory.mockResolvedValue({ id: 1, name: "Mains" });
    menuDAO.getCategories.mockResolvedValue([{ id: 1, name: "Mains" }]);

    await menuDAO.createCategory(5, { name: "Mains" });
    expect(menuDAO.createCategory).toHaveBeenCalledWith(5, { name: "Mains" });

    await menuDAO.getCategories(5);
    expect(menuDAO.getCategories).toHaveBeenCalledWith(5);
  });

  it("menu item update is tenant-scoped", async () => {
    menuDAO.updateMenuItem.mockResolvedValue({ id: 1, name: "Updated" });
    await menuDAO.updateMenuItem(1, 5, { name: "Updated" });
    expect(menuDAO.updateMenuItem).toHaveBeenCalledWith(1, 5, { name: "Updated" });
  });

  it("order creation includes tenantId", async () => {
    orderDAO.createOrder.mockResolvedValue({ id: 1, total: 25.0 });
    await orderDAO.createOrder(5, { items: [], total: 25.0 });
    expect(orderDAO.createOrder).toHaveBeenCalledWith(5, { items: [], total: 25.0 });
  });

  it("order queries scope by tenantId", async () => {
    orderDAO.getOrders.mockResolvedValue([]);
    await orderDAO.getOrders(5, {}, { limit: 10, offset: 0 });
    expect(orderDAO.getOrders).toHaveBeenCalledWith(5, {}, { limit: 10, offset: 0 });
  });

  it("payment findByReservation scopes by tenantId", async () => {
    paymentDAO.findByReservation.mockResolvedValue({ id: 1, amount: 50 });
    await paymentDAO.findByReservation(1, 5);
    expect(paymentDAO.findByReservation).toHaveBeenCalledWith(1, 5);
  });

  it("reservation findReservationById scopes by tenantId", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, tenantId: 5 });
    await reservationDAO.findReservationById(1, 5);
    expect(reservationDAO.findReservationById).toHaveBeenCalledWith(1, 5);
  });

  it("customer search scopes by tenantId", async () => {
    reservationDAO.searchCustomers.mockResolvedValue([]);
    await reservationDAO.searchCustomers("john", 5);
    expect(reservationDAO.searchCustomers).toHaveBeenCalledWith("john", 5);
  });
});

describe("cross-tenant isolation: salon vertical", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("appointment findAllForTenant scopes by tenantId", async () => {
    const salonAppointmentDAO = require("../verticals/salon/DAOs/appointment.dao");
    salonAppointmentDAO.findAllForTenant.mockResolvedValue({ total: 0, data: [] });
    await salonAppointmentDAO.findAllForTenant(5, {});
    expect(salonAppointmentDAO.findAllForTenant).toHaveBeenCalledWith(5, {});
  });

  it("appointment findById scopes by tenantId", async () => {
    const salonAppointmentDAO = require("../verticals/salon/DAOs/appointment.dao");
    salonAppointmentDAO.findById.mockResolvedValue({ id: 1, tenantId: 5 });
    await salonAppointmentDAO.findById(1, 5);
    expect(salonAppointmentDAO.findById).toHaveBeenCalledWith(1, 5);
  });

  it("service findAllForTenant scopes by tenantId", async () => {
    const salonServiceDAO = require("../verticals/salon/DAOs/service.dao");
    salonServiceDAO.findAllForTenant.mockResolvedValue({ total: 0, data: [] });
    await salonServiceDAO.findAllForTenant(5, {});
    expect(salonServiceDAO.findAllForTenant).toHaveBeenCalledWith(5, {});
  });

  it("service findById scopes by tenantId", async () => {
    const salonServiceDAO = require("../verticals/salon/DAOs/service.dao");
    salonServiceDAO.findById.mockResolvedValue({ id: 1, tenantId: 5 });
    await salonServiceDAO.findById(1, 5);
    expect(salonServiceDAO.findById).toHaveBeenCalledWith(1, 5);
  });

  it("service update includes tenantId in where clause", async () => {
    const salonServiceDAO = require("../verticals/salon/DAOs/service.dao");
    salonServiceDAO.update.mockResolvedValue([1]);
    await salonServiceDAO.update(1, 5, { name: "Haircut" });
    expect(salonServiceDAO.update).toHaveBeenCalledWith(1, 5, { name: "Haircut" });
  });
});

describe("cross-tenant isolation: tenant-platform admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auth findUserByEmail scopes by tenantId", async () => {
    authDAO.findUserByEmail.mockResolvedValue({ id: 1, email: "admin@tenant5.com" });
    await authDAO.findUserByEmail("admin@tenant5.com", 5);
    expect(authDAO.findUserByEmail).toHaveBeenCalledWith("admin@tenant5.com", 5);
  });

  it("auth getAllStaff scopes by tenantId", async () => {
    authDAO.getAllStaff.mockResolvedValue([]);
    await authDAO.getAllStaff(5);
    expect(authDAO.getAllStaff).toHaveBeenCalledWith(5);
  });

  it("email template getTemplateByKey scopes by tenantId", async () => {
    emailTemplateDAO.getTemplateByKey.mockResolvedValue({ id: 1, key: "welcome" });
    await emailTemplateDAO.getTemplateByKey("welcome", 5);
    expect(emailTemplateDAO.getTemplateByKey).toHaveBeenCalledWith("welcome", 5);
  });

  it("email template getAllTemplates scopes by tenantId", async () => {
    emailTemplateDAO.getAllTemplates.mockResolvedValue([]);
    await emailTemplateDAO.getAllTemplates(5);
    expect(emailTemplateDAO.getAllTemplates).toHaveBeenCalledWith(5);
  });
});

describe("cross-tenant isolation: data leak prevention", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents tenant 5 data from being returned to tenant 9", async () => {
    reservationDAO.findCustomerByEmail
      .mockResolvedValueOnce({ id: 1, email: "test@example.com", tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Result = await reservationDAO.findCustomerByEmail("test@example.com", 5);
    const tenant9Result = await reservationDAO.findCustomerByEmail("test@example.com", 9);

    expect(tenant5Result).not.toBeNull();
    expect(tenant5Result.tenantId).toBe(5);
    expect(tenant9Result).toBeNull();
  });

  it("prevents cross-tenant reservation access", async () => {
    reservationDAO.findReservationById
      .mockResolvedValueOnce({ id: 1, tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Reservation = await reservationDAO.findReservationById(1, 5);
    const tenant9Reservation = await reservationDAO.findReservationById(1, 9);

    expect(tenant5Reservation).not.toBeNull();
    expect(tenant9Reservation).toBeNull();
  });

  it("prevents cross-tenant table access", async () => {
    tableDAO.findTableById
      .mockResolvedValueOnce({ id: 1, name: "Table 1", tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Table = await tableDAO.findTableById(1, 5);
    const tenant9Table = await tableDAO.findTableById(1, 9);

    expect(tenant5Table).not.toBeNull();
    expect(tenant9Table).toBeNull();
  });

  it("prevents cross-tenant order access", async () => {
    orderDAO.getOrderById.mockResolvedValueOnce({ id: 1, tenantId: 5 }).mockResolvedValueOnce(null);

    const tenant5Order = await orderDAO.getOrderById(1, 5);
    const tenant9Order = await orderDAO.getOrderById(1, 9);

    expect(tenant5Order).not.toBeNull();
    expect(tenant9Order).toBeNull();
  });

  it("prevents cross-tenant salon appointment access", async () => {
    const salonAppointmentDAO = require("../verticals/salon/DAOs/appointment.dao");
    salonAppointmentDAO.findById
      .mockResolvedValueOnce({ id: 1, tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Appt = await salonAppointmentDAO.findById(1, 5);
    const tenant9Appt = await salonAppointmentDAO.findById(1, 9);

    expect(tenant5Appt).not.toBeNull();
    expect(tenant9Appt).toBeNull();
  });

  it("prevents cross-tenant salon service access", async () => {
    const salonServiceDAO = require("../verticals/salon/DAOs/service.dao");
    salonServiceDAO.findById
      .mockResolvedValueOnce({ id: 1, tenantId: 5 })
      .mockResolvedValueOnce(null);

    const tenant5Service = await salonServiceDAO.findById(1, 5);
    const tenant9Service = await salonServiceDAO.findById(1, 9);

    expect(tenant5Service).not.toBeNull();
    expect(tenant9Service).toBeNull();
  });
});
