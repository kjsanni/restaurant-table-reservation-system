"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const schedules = days.map((day) => ({
      dayOfWeek: day,
      openTime: "11:00:00",
      closeTime: "23:00:00",
      isClosed: false,
      slotDuration: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert("schedules", schedules);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("schedules", null, {});
  },
};