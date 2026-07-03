module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("emailTemplates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      key: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      variables: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.bulkInsert("emailTemplates", [
      {
        key: "reservation_confirmation",
        name: "Reservation Confirmation",
        subject: "Your Reservation is Confirmed - {{restaurantName}}",
        body: "Hi {{customerName}},\n\nYour reservation has been confirmed!\n\nDetails:\n- Date: {{date}}\n- Time: {{time}}\n- Party Size: {{partySize}}\n- Table: {{table}}\n\nLooking forward to seeing you!\n{{restaurantName}}",
        variables: JSON.stringify(["customerName", "date", "time", "partySize", "table"]),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "reservation_reminder",
        name: "Reservation Reminder",
        subject: "Reminder: Your reservation tomorrow at {{restaurantName}}",
        body: "Hi {{customerName}},\n\nThis is a reminder for your reservation tomorrow:\n\n- Date: {{date}}\n- Time: {{time}}\n- Party Size: {{partySize}}\n\nPlease arrive on time.\n{{restaurantName}}",
        variables: JSON.stringify(["customerName", "date", "time", "partySize"]),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "waitlist_offer",
        name: "Waitlist Offer",
        subject: "Table Ready - {{restaurantName}}",
        body: "Hi {{customerName}},\n\nA table is ready for your party of {{partySize}}!\n\nPlease arrive within 5 minutes or your spot may be given to the next guest.\n\nThank you!\n{{restaurantName}}",
        variables: JSON.stringify(["customerName", "partySize"]),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "no_show_alert",
        name: "No-Show Alert",
        subject: "Missed Reservation - Follow-up",
        body: "Hi {{customerName}},\n\nWe noticed you missed your reservation on {{date}} at {{time}}.\n\nIf you'd like to reschedule, please call us.\n{{restaurantName}}",
        variables: JSON.stringify(["customerName", "date", "time"]),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("emailTemplates");
  },
};