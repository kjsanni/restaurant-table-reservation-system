const whatsappAppointmentService = require("../verticals/salon/services/whatsappAppointment.service");

jest.mock("../verticals/salon/services/appointmentScheduling.service", () => ({
  findAvailableSlots: jest.fn(),
  checkConflicts: jest.fn(),
}));

jest.mock("../verticals/salon/DAOs/appointment.dao", () => ({
  findAllForTenant: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../services/customerService", () => ({
  searchCustomers: jest.fn().mockResolvedValue([]),
  findOrCreateCustomer: jest.fn().mockResolvedValue({ id: 99, email: "wa_+233241234567@salon.local" }),
}));

jest.mock("../tenant-platform/services/paystack.service", () => ({
  initializeCharge: jest.fn().mockResolvedValue({ authorization_url: "https://paystack.co/pay/123", reference: "ref-123" }),
}));

jest.mock("../services/whatsapp.service", () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({}),
  formatPhoneNumber: jest.fn((p) => p),
}));

jest.mock("../services/messageTemplates.service", () => ({
  render: jest.fn(async (name, vars) => {
    const defaults = {
      salon_appointment_reminder: "Reminder {{name}}",
    };
    let text = defaults[name] || name;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{{${k}}}`, String(v));
      }
    }
    return text;
  }),
}));

jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

const appointmentSchedulingService = require("../verticals/salon/services/appointmentScheduling.service");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const customerService = require("../services/customerService");
const { cache } = require("../utils/cache");

describe("whatsappAppointment.service — salon booking flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
    appointmentSchedulingService.findAvailableSlots.mockResolvedValue([
      { start: "2026-08-01T10:00:00.000Z", end: "2026-08-01T10:30:00.000Z" },
    ]);
    appointmentSchedulingService.checkConflicts.mockResolvedValue({ hasConflict: false });
    appointmentDao.findAllForTenant.mockResolvedValue({
      total: 1,
      data: [{ id: 1, serviceId: 1, service: { id: 1, name: "Haircut", durationMinutes: 30, price: 50 } }],
    });
    appointmentDao.create.mockResolvedValue({ id: 10, status: "confirmed" });
    customerService.searchCustomers.mockResolvedValue([]);
    customerService.findOrCreateCustomer.mockResolvedValue({ id: 99, email: "wa_+233241234567@salon.local" });
  });

  const setSessionState = (state, extra = {}) => {
    cache.get.mockImplementation((key) => {
      if (key.startsWith("whatsapp:salon:session:")) {
        return Promise.resolve({ state, tenantId: 1, ...extra });
      }
      return Promise.resolve(null);
    });
  };

  it("starts salon appointment flow from idle state", async () => {
    await whatsappAppointmentService.startSalonAppointmentFlow("+233241234567", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:salon:session:+233241234567",
      expect.objectContaining({ state: "salon_service", flow: "salon_appointment", tenantId: 1 }),
      86400
    );
  });

  it("selects service and shows date prompt", async () => {
    const session = {
      state: "salon_service",
      flow: "salon_appointment",
      services: [{ id: 1, name: "Haircut", durationMinutes: 30 }],
    };

    await whatsappAppointmentService.handleSalonAppointmentState("+233241234567", "1", "1", session, 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:salon:session:+233241234567",
      expect.objectContaining({ state: "salon_date", selectedServiceId: 1 }),
      86400
    );
  });

  it("shows available slots for valid date", async () => {
    const session = {
      state: "salon_date",
      flow: "salon_appointment",
      selectedServiceId: 1,
    };

    await whatsappAppointmentService.handleSalonAppointmentState("+233241234567", "2026-08-01", "2026-08-01", session, 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:salon:session:+233241234567",
      expect.objectContaining({ state: "salon_time", selectedDate: "2026-08-01" }),
      86400
    );
  });

  it("confirms booking on yes and initializes Paystack charge", async () => {
    const session = {
      state: "salon_confirm",
      flow: "salon_appointment",
      tenantId: 1,
      selectedServiceId: 1,
      selectedSlot: { start: "2026-08-01T10:00:00.000Z", end: "2026-08-01T10:30:00.000Z" },
      selectedStylistId: 2,
      customerName: "John Doe",
      customerPhone: "+233241234567",
      services: [{ id: 1, name: "Haircut", durationMinutes: 30, price: 50 }],
    };

    await whatsappAppointmentService.handleSalonAppointmentState("+233241234567", "yes", "yes", session, 1);

    expect(appointmentDao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 1,
        serviceId: 1,
        stylistId: 2,
        source: "whatsapp",
        status: "confirmed",
      })
    );
  });

  it("cancels booking on no", async () => {
    const session = {
      state: "salon_confirm",
      flow: "salon_appointment",
      tenantId: 1,
    };

    await whatsappAppointmentService.handleSalonAppointmentState("+233241234567", "no", "no", session, 1);

    expect(appointmentDao.create).not.toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:salon:session:+233241234567",
      expect.objectContaining({ state: "idle", tenantId: 1 }),
      86400
    );
  });
});
