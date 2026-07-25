describe("salonCron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("processRecurringAppointments", () => {
    const baseRecurring = {
      id: 1,
      tenantId: 1,
      customerId: 10,
      serviceId: 5,
      stylistId: 2,
      stationId: 3,
      frequency: "weekly",
      interval: 1,
      startDate: "2026-07-01",
      endDate: null,
      timeOfDay: "10:00",
      durationMinutes: 30,
      active: true,
      lastGeneratedAt: null,
    };

    it("creates an appointment for today when startDate is today and no lastGeneratedAt", async () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const recurring = {
        ...baseRecurring,
        startDate: todayStr,
        lastGeneratedAt: null,
      };

      const cron = require("../verticals/salon/utils/salonCron");
      const recurringDao = require("../verticals/salon/DAOs/recurringAppointment.dao");
      const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
      const notificationService = require("../services/notification.service");

      jest.spyOn(recurringDao, "findActiveForDateRange").mockResolvedValue([recurring]);
      jest.spyOn(recurringDao, "update").mockResolvedValue({ id: 1 });
      jest.spyOn(appointmentDao, "findExistingInstance").mockResolvedValue(null);
      jest.spyOn(appointmentDao, "create").mockResolvedValue({ id: 100 });
      jest.spyOn(notificationService, "sendSalonConfirmation").mockResolvedValue();

      const result = await cron.processRecurringAppointments(1);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(todayStr);
    });

    it("skips past weekly occurrences without backfilling and advances lastGeneratedAt", async () => {
      const recurring = {
        ...baseRecurring,
        lastGeneratedAt: "2026-07-15",
        startDate: "2026-07-01",
      };

      const cron = require("../verticals/salon/utils/salonCron");
      const recurringDao = require("../verticals/salon/DAOs/recurringAppointment.dao");
      const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
      const notificationService = require("../services/notification.service");

      jest.spyOn(recurringDao, "findActiveForDateRange").mockResolvedValue([recurring]);
      jest.spyOn(recurringDao, "update").mockResolvedValue({ id: 1 });
      jest.spyOn(appointmentDao, "findExistingInstance").mockResolvedValue(null);
      jest.spyOn(appointmentDao, "create").mockResolvedValue({ id: 100 });
      jest.spyOn(notificationService, "sendSalonConfirmation").mockResolvedValue();

      const result = await cron.processRecurringAppointments(1);

      expect(result).toHaveLength(0);
    });

    it("skips recurring templates past their endDate", async () => {
      const recurring = {
        ...baseRecurring,
        startDate: "2026-07-01",
        endDate: "2026-07-20",
        lastGeneratedAt: null,
      };

      const cron = require("../verticals/salon/utils/salonCron");
      const recurringDao = require("../verticals/salon/DAOs/recurringAppointment.dao");

      jest.spyOn(recurringDao, "findActiveForDateRange").mockResolvedValue([recurring]);
      jest.spyOn(recurringDao, "update").mockResolvedValue();

      const result = await cron.processRecurringAppointments(1);

      expect(result).toHaveLength(0);
    });

    it("does not create duplicate appointments when one already exists", async () => {
      const recurring = {
        ...baseRecurring,
        startDate: "2026-07-01",
        lastGeneratedAt: null,
      };

      const cron = require("../verticals/salon/utils/salonCron");
      const recurringDao = require("../verticals/salon/DAOs/recurringAppointment.dao");
      const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

      jest.spyOn(recurringDao, "findActiveForDateRange").mockResolvedValue([recurring]);
      jest.spyOn(recurringDao, "update").mockResolvedValue({ id: 1 });
      jest.spyOn(appointmentDao, "findExistingInstance").mockResolvedValue({ id: 999 });
      jest.spyOn(appointmentDao, "create").mockResolvedValue({ id: 100 });

      const result = await cron.processRecurringAppointments(1);

      expect(result).toHaveLength(0);
    });
  });

  describe("processMarketingCampaigns", () => {
    it("resolves all salon customers when targetAudience is all", async () => {
      const tenantId = 1;
      const campaign = {
        id: 1,
        tenantId,
        status: "scheduled",
        scheduledAt: new Date(),
        content: "Promo",
        targetAudience: "all",
      };

      const cron = require("../verticals/salon/utils/salonCron");
      const marketingDao = require("../verticals/salon/DAOs/marketingCampaign.dao");
      const models = require("../db/models");
      const notificationService = require("../services/notification.service");

      jest.spyOn(marketingDao, "findDueForSending").mockResolvedValue([campaign]);
      jest.spyOn(marketingDao, "update").mockResolvedValue({ id: 1 });
      jest.spyOn(models.sequelize.models.customer, "findAll").mockResolvedValue([
        { id: 1, phone: "+233241000001", email: "a@test.com" },
        { id: 2, phone: "+233241000002", email: "b@test.com" },
      ]);
      jest.spyOn(notificationService, "sendViaChannels").mockResolvedValue({ success: true });

      const result = await cron.processMarketingCampaigns(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ campaignId: 1, status: "sent" });
    });
  });
});
