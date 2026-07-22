"use strict";
const appointmentSchedulingService = require("./appointmentScheduling.service");

const whatsappAppointmentService = {
  async processBookingFlow(tenantId, customerPhone, serviceId, preferredDate, stylistId = null) {
    const slots = await appointmentSchedulingService.findAvailableSlots(
      tenantId,
      serviceId,
      preferredDate,
      stylistId
    );
    return {
      slots: slots.slice(0, 10),
      message: slots.length > 0 ? "Available slots found" : "No slots available for this date",
    };
  },

  async confirmBooking(tenantId, bookingData) {
    const conflict = await appointmentSchedulingService.checkConflicts(
      tenantId,
      bookingData.stationId,
      bookingData.stylistId,
      bookingData.start,
      bookingData.durationMinutes,
      0
    );

    if (conflict.hasConflict) {
      return { success: false, message: "Time slot no longer available", conflicts: conflict.conflicts };
    }

    return { success: true, message: "Booking confirmed", conflicts: null };
  },
};

module.exports = whatsappAppointmentService;
