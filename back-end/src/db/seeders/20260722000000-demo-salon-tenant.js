"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const tenantId = 1;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const formatDate = (date) => date.toISOString().slice(0, 10);
    const formatDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");

    const addDays = (date, days) => {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    };

    const addMinutes = (date, minutes) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + minutes);
      return d;
    };

    await queryInterface.sequelize.query(
      `UPDATE tenants SET businessVertical = 'salon', updatedAt = :now WHERE id = :tenantId`,
      { replacements: { now: formatDateTime(now), tenantId } }
    );

    const stylists = [
      { username: "akua Mensah", email: "akua@demo.test", firstName: "Akua", lastName: "Mensah" },
      { username: "kwame Asante", email: "kwame@demo.test", firstName: "Kwame", lastName: "Asante" },
      { username: "ama Osei", email: "ama@demo.test", firstName: "Ama", lastName: "Osei" },
      { username: "kofi Boateng", email: "kofi@demo.test", firstName: "Kofi", lastName: "Boateng" },
      { username: "efua Owusu", email: "efua@demo.test", firstName: "Efua", lastName: "Owusu" },
    ];

    const passwordHash = await bcrypt.hash("password123", 10);

    const users = stylists.map((s, idx) => ({
      tenantId,
      username: s.username,
      email: s.email,
      password: passwordHash,
      role: "staff",
      permissions: JSON.stringify({
        view_reservations: false,
        edit_reservations: false,
        manage_tables: false,
        manage_schedule: true,
        manage_staff: false,
        view_appointments: true,
        edit_appointments: true,
        manage_stations: false,
        manage_services: false,
      }),
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("users", users, { ignoreDuplicates: true });

    const [stylistRows] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users WHERE tenantId = :tenantId AND role = 'staff' ORDER BY id`,
      { replacements: { tenantId } }
    );
    const stylistIdMap = {};
    stylistRows.forEach((row) => {
      stylistIdMap[row.username] = row.id;
    });

    const categories = [
      { name: "Hair", sortOrder: 1 },
      { name: "Nails", sortOrder: 2 },
      { name: "Facial", sortOrder: 3 },
      { name: "Massage", sortOrder: 4 },
      { name: "Treatment", sortOrder: 5 },
      { name: "Color", sortOrder: 6 },
      { name: "Other", sortOrder: 7 },
    ];

    await queryInterface.bulkInsert(
      "service_categories",
      categories.map((c) => ({ ...c, tenantId, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );

    const [catRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM service_categories WHERE tenantId = :tenantId ORDER BY id`,
      { replacements: { tenantId } }
    );
    const categoryIdMap = {};
    catRows.forEach((row) => {
      categoryIdMap[row.name] = row.id;
    });

    const stations = [
      { name: "Chair 1", type: "chair", zone: "A", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Chair 2", type: "chair", zone: "A", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Chair 3", type: "chair", zone: "B", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Wash Bay 1", type: "wash", zone: "A", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Wash Bay 2", type: "wash", zone: "B", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Color Station 1", type: "color", zone: "C", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Nail Station 1", type: "nail", zone: "D", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Nail Station 2", type: "nail", zone: "D", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Therapy Room 1", type: "therapy", zone: "E", capacity: 1, isOccupied: false, isBlocked: false },
      { name: "Therapy Room 2", type: "therapy", zone: "E", capacity: 1, isOccupied: false, isBlocked: false },
    ];

    await queryInterface.bulkInsert(
      "stations",
      stations.map((s) => ({ ...s, tenantId, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );

    const [stationRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM stations WHERE tenantId = :tenantId ORDER BY id`,
      { replacements: { tenantId } }
    );
    const stationIdMap = {};
    stationRows.forEach((row) => {
      stationIdMap[row.name] = row.id;
    });

    const services = [
      { name: "Classic Haircut", description: "Precision cut and style", price: 80, durationMinutes: 45, depositAmount: 20, bufferMinutes: 10, categoryId: categoryIdMap["Hair"], defaultStylistId: stylistIdMap["akua Mensah"], requiresStationType: "chair", whatsappBookable: true, isAvailable: true },
      { name: "Gentleman's Cut", description: "Classic men's haircut", price: 60, durationMinutes: 30, depositAmount: 15, bufferMinutes: 5, categoryId: categoryIdMap["Hair"], defaultStylistId: stylistIdMap["kwame Asante"], requiresStationType: "chair", whatsappBookable: true, isAvailable: true },
      { name: "Kids Haircut", description: "Haircut for children under 12", price: 45, durationMinutes: 25, depositAmount: 10, bufferMinutes: 5, categoryId: categoryIdMap["Hair"], defaultStylistId: stylistIdMap["akua Mensah"], requiresStationType: "chair", whatsappBookable: true, isAvailable: true },
      { name: "Deep Conditioning", description: "Moisturizing treatment", price: 120, durationMinutes: 60, depositAmount: 30, bufferMinutes: 15, categoryId: categoryIdMap["Treatment"], defaultStylistId: stylistIdMap["ama Osei"], requiresStationType: "wash", whatsappBookable: true, isAvailable: true },
      { name: "Full Color", description: "Full-head color application", price: 350, durationMinutes: 120, depositAmount: 100, bufferMinutes: 20, categoryId: categoryIdMap["Color"], defaultStylistId: stylistIdMap["kofi Boateng"], requiresStationType: "color", whatsappBookable: true, isAvailable: true },
      { name: "Highlights", description: "Partial highlights", price: 280, durationMinutes: 90, depositAmount: 80, bufferMinutes: 15, categoryId: categoryIdMap["Color"], defaultStylistId: stylistIdMap["kofi Boateng"], requiresStationType: "color", whatsappBookable: true, isAvailable: true },
      { name: "Gel Manicure", description: "Gel polish manicure", price: 150, durationMinutes: 45, depositAmount: 40, bufferMinutes: 10, categoryId: categoryIdMap["Nails"], defaultStylistId: stylistIdMap["efua Owusu"], requiresStationType: "nail", whatsappBookable: true, isAvailable: true },
      { name: "Acrylic Full Set", description: "Full acrylic nail set", price: 220, durationMinutes: 75, depositAmount: 60, bufferMinutes: 15, categoryId: categoryIdMap["Nails"], defaultStylistId: stylistIdMap["efua Owusu"], requiresStationType: "nail", whatsappBookable: true, isAvailable: true },
      { name: "Facial Cleanup", description: "Basic facial cleansing", price: 200, durationMinutes: 50, depositAmount: 50, bufferMinutes: 10, categoryId: categoryIdMap["Facial"], defaultStylistId: stylistIdMap["ama Osei"], requiresStationType: "therapy", whatsappBookable: true, isAvailable: true },
      { name: "Full Body Massage", description: "60-minute relaxation massage", price: 400, durationMinutes: 60, depositAmount: 100, bufferMinutes: 15, categoryId: categoryIdMap["Massage"], defaultStylistId: stylistIdMap["kwame Asante"], requiresStationType: "therapy", whatsappBookable: true, isAvailable: true },
      { name: "Scalp Massage", description: "Therapeutic scalp massage", price: 120, durationMinutes: 30, depositAmount: 30, bufferMinutes: 5, categoryId: categoryIdMap["Massage"], defaultStylistId: stylistIdMap["ama Osei"], requiresStationType: "therapy", whatsappBookable: true, isAvailable: true },
      { name: "Hair Relaxing", description: "Relaxer touch-up", price: 180, durationMinutes: 75, depositAmount: 50, bufferMinutes: 15, categoryId: categoryIdMap["Treatment"], defaultStylistId: stylistIdMap["akua Mensah"], requiresStationType: "chair", whatsappBookable: true, isAvailable: true },
    ];

    await queryInterface.bulkInsert(
      "services",
      services.map((s) => ({ ...s, tenantId, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );

    const [serviceRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM services WHERE tenantId = :tenantId ORDER BY id`,
      { replacements: { tenantId } }
    );
    const serviceIdMap = {};
    serviceRows.forEach((row) => {
      serviceIdMap[row.name] = row.id;
    });

    const staffServiceSkills = [
      { userId: stylistIdMap["akua Mensah"], serviceId: serviceIdMap["Classic Haircut"], skillLevel: "expert" },
      { userId: stylistIdMap["akua Mensah"], serviceId: serviceIdMap["Kids Haircut"], skillLevel: "expert" },
      { userId: stylistIdMap["akua Mensah"], serviceId: serviceIdMap["Hair Relaxing"], skillLevel: "proficient" },
      { userId: stylistIdMap["akua Mensah"], serviceId: serviceIdMap["Deep Conditioning"], skillLevel: "proficient" },
      { userId: stylistIdMap["kwame Asante"], serviceId: serviceIdMap["Gentleman's Cut"], skillLevel: "expert" },
      { userId: stylistIdMap["kwame Asante"], serviceId: serviceIdMap["Full Body Massage"], skillLevel: "proficient" },
      { userId: stylistIdMap["kwame Asante"], serviceId: serviceIdMap["Scalp Massage"], skillLevel: "expert" },
      { userId: stylistIdMap["ama Osei"], serviceId: serviceIdMap["Deep Conditioning"], skillLevel: "expert" },
      { userId: stylistIdMap["ama Osei"], serviceId: serviceIdMap["Facial Cleanup"], skillLevel: "expert" },
      { userId: stylistIdMap["ama Osei"], serviceId: serviceIdMap["Scalp Massage"], skillLevel: "proficient" },
      { userId: stylistIdMap["kofi Boateng"], serviceId: serviceIdMap["Full Color"], skillLevel: "expert" },
      { userId: stylistIdMap["kofi Boateng"], serviceId: serviceIdMap["Highlights"], skillLevel: "expert" },
      { userId: stylistIdMap["efua Owusu"], serviceId: serviceIdMap["Gel Manicure"], skillLevel: "expert" },
      { userId: stylistIdMap["efua Owusu"], serviceId: serviceIdMap["Acrylic Full Set"], skillLevel: "expert" },
    ];

    await queryInterface.bulkInsert(
      "staff_service_skills",
      staffServiceSkills.map((s) => ({ ...s, tenantId, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );

    const customers = [
      { firstName: "Abena", lastName: "Mensah", email: "abena@demo.test", phone: "0244123456", city: "Accra" },
      { firstName: "Kofi", lastName: "Danso", email: "kofi.d@demo.test", phone: "0277123456", city: "Kumasi" },
      { firstName: "Akosua", lastName: "Boateng", email: "akosua@demo.test", phone: "0200123456", city: "Accra" },
      { firstName: "Yaw", lastName: "Owusu", email: "yaw.o@demo.test", phone: "0268123456", city: "Tema" },
      { firstName: "Efua", lastName: "Asare", email: "efua.a@demo.test", phone: "0248987654", city: "Accra" },
      { firstName: "Kwame", lastName: "Amponsah", email: "kwame.a@demo.test", phone: "0277987654", city: "Cape Coast" },
      { firstName: "Ama", lastName: "Frimpong", email: "ama.f@demo.test", phone: "0200987654", city: "Accra" },
      { firstName: "Nana", lastName: "Kumah", email: "nana.k@demo.test", phone: "0268123987", city: "Kumasi" },
      { firstName: "Adwoa", lastName: "Poku", email: "adwoa.p@demo.test", phone: "0244567890", city: "Accra" },
      { firstName: "Kwabena", lastName: "Sarpong", email: "kwabena.s@demo.test", phone: "0277456789", city: "Accra" },
      { firstName: "Abena", lastName: "Darkwa", email: "abena.d@demo.test", phone: "0200345678", city: "Tema" },
      { firstName: "Kofi", lastName: "Nsiah", email: "kofi.n@demo.test", phone: "0268345678", city: "Accra" },
      { firstName: "Akua", lastName: "Tandoh", email: "akua.t@demo.test", phone: "0244789012", city: "Kumasi" },
      { firstName: "Yaw", lastName: "Mireku", email: "yaw.m@demo.test", phone: "0277890123", city: "Accra" },
      { firstName: "Efua", lastName: "Agyeman", email: "efua.ag@demo.test", phone: "0200789012", city: "Cape Coast" },
      { firstName: "Kwame", lastName: "Bonsu", email: "kwame.b@demo.test", phone: "0268234567", city: "Accra" },
      { firstName: "Ama", lastName: "Nyarko", email: "ama.n@demo.test", phone: "0244678901", city: "Tema" },
      { firstName: "Nana", lastName: "Adu", email: "nana.a@demo.test", phone: "0277567890", city: "Kumasi" },
      { firstName: "Adwoa", lastName: "Owusu", email: "adwoa.o@demo.test", phone: "0200456789", city: "Accra" },
      { firstName: "Kwabena", lastName: "Fosu", email: "kwabena.f@demo.test", phone: "0268456789", city: "Accra" },
    ];

    await queryInterface.bulkInsert(
      "Customers",
      customers.map((c) => ({ ...c, tenantId, tags: JSON.stringify([]), visitCount: 0, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );

    const [customerRows] = await queryInterface.sequelize.query(
      `SELECT id, firstName, lastName, email FROM Customers WHERE tenantId = :tenantId ORDER BY id`,
      { replacements: { tenantId } }
    );
    const customerIdMap = {};
    customerRows.forEach((row) => {
      customerIdMap[row.email] = row.id;
    });

    const stylistUserIds = Object.values(stylistIdMap);
    const serviceIds = Object.values(serviceIdMap);
    const stationIds = Object.values(stationIdMap);
    const customerIds = Object.values(customerIdMap);

    const appointments = [];
    const statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

    for (let i = 0; i < 55; i++) {
      const daysOffset = Math.floor(i / 4) - 5;
      const startHour = 9 + (i % 8);
      const start = addMinutes(addDays(today, daysOffset), startHour * 60);
      const serviceId = serviceIds[i % serviceIds.length];
      const service = services.find((s) => s.id === serviceId);
      const duration = service ? service.durationMinutes : 30;
      const end = addMinutes(start, duration);

      let status;
      if (daysOffset < -1) status = "completed";
      else if (daysOffset === -1) status = statuses[i % 3];
      else if (daysOffset === 0) status = statuses[(i % 4) + 2];
      else status = i % 6 === 0 ? "cancelled" : i % 7 === 0 ? "no_show" : "confirmed";

      appointments.push({
        tenantId,
        customerId: customerIds[i % customerIds.length],
        serviceId,
        stationId: stationIds[i % stationIds.length],
        stylistId: stylistUserIds[i % stylistUserIds.length],
        start: formatDateTime(start),
        durationMinutes: duration,
        status,
        paymentStatus: status === "completed" ? "paid" : status === "cancelled" ? "unpaid" : "unpaid",
        depositAmount: status === "completed" ? 0 : service ? service.depositAmount : 0,
        notes: status === "cancelled" ? "Client requested cancellation" : status === "no_show" ? "Client did not arrive" : null,
        source: ["web", "whatsapp", "phone", "walkin"][i % 4],
        cancelledAt: status === "cancelled" ? formatDateTime(end) : null,
        completedAt: status === "completed" ? formatDateTime(end) : null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert("appointments", appointments, { ignoreDuplicates: true });

    const salonClientProfiles = [];
    for (let i = 0; i < Math.min(customerIds.length, 20); i++) {
      salonClientProfiles.push({
        tenantId,
        customerId: customerIds[i],
        hairType: ["straight", "wavy", "curly", "coily", "no_preference"][i % 5],
        preferredStylistId: stylistUserIds[i % stylistUserIds.length],
        paymentPreference: ["cash_at_salon", "card_paystack", "whatsapp_momo"][i % 3],
        whatsappBookingEnabled: i % 3 !== 0,
        birthday: formatDate(addDays(today, -(i * 37) % 365)),
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert(
      "salon_client_profiles",
      salonClientProfiles,
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("salon_client_profiles", { tenantId: 1 }, {});
    await queryInterface.bulkDelete("appointments", { tenantId: 1 }, {});
    await queryInterface.bulkDelete("staff_service_skills", { tenantId: 1 }, {});
    await queryInterface.bulkDelete("services", { tenantId: 1 }, {});
    await queryInterface.bulkDelete("stations", { tenantId: 1 }, {});
    await queryInterface.bulkDelete("service_categories", { tenantId: 1 }, {});
    await queryInterface.sequelize.query(
      `UPDATE tenants SET businessVertical = 'restaurant', updatedAt = :now WHERE id = :tenantId`,
      { replacements: { now: new Date().toISOString().slice(0, 19).replace("T", " "), tenantId: 1 } }
    );
    await queryInterface.bulkDelete("users", { tenantId: 1 }, {});
  },
};
