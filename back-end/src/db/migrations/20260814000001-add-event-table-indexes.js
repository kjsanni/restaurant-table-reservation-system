"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("Events", ["tenantId"], { name: "events_tenant_id_idx" });
    await queryInterface.addIndex("TicketTypes", ["tenantId"], { name: "ticket_types_tenant_id_idx" });
    await queryInterface.addIndex("TicketTypes", ["eventId"], { name: "ticket_types_event_id_idx" });
    await queryInterface.addIndex("GuestLists", ["tenantId"], { name: "guest_lists_tenant_id_idx" });
    await queryInterface.addIndex("GuestLists", ["eventId"], { name: "guest_lists_event_id_idx" });
    await queryInterface.addIndex("QRCodes", ["tenantId"], { name: "qr_codes_tenant_id_idx" });
    await queryInterface.addIndex("QRCodes", ["eventId"], { name: "qr_codes_event_id_idx" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Events", "events_tenant_id_idx");
    await queryInterface.removeIndex("TicketTypes", "ticket_types_tenant_id_idx");
    await queryInterface.removeIndex("TicketTypes", "ticket_types_event_id_idx");
    await queryInterface.removeIndex("GuestLists", "guest_lists_tenant_id_idx");
    await queryInterface.removeIndex("GuestLists", "guest_lists_event_id_idx");
    await queryInterface.removeIndex("QRCodes", "qr_codes_tenant_id_idx");
    await queryInterface.removeIndex("QRCodes", "qr_codes_event_id_idx");
  },
};
