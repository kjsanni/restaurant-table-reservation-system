const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const dataAnonymizationDAO = {};

const MASKED_NAME = "Anonymous";
const MASKED_EMAIL_DOMAIN = "example.com";
const MASKED_PHONE = "XXXXXXXXXXX";

dataAnonymizationDAO.anonymizeTenant = async (tenantId, performedBy) => {
  const customers = await db.customer.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId },
    attributes: ["id", "firstName", "lastName", "email", "phone"],
  });

  const updatedCustomers = [];
  for (const customer of customers) {
    const maskedFirstName = MASKED_NAME;
    const maskedLastName = MASKED_NAME;
    const maskedEmail = `user_${customer.id}@${MASKED_EMAIL_DOMAIN}`;
    const maskedPhone = MASKED_PHONE;

    await customer.update({ // codacy-suppress nosql-injection - parameterized ORM call
      firstName: maskedFirstName,
      lastName: maskedLastName,
      email: maskedEmail,
      phone: maskedPhone,
    });

    updatedCustomers.push({
      id: customer.id,
      maskedEmail,
      maskedPhone,
    });
  }

  await platformAuditDAO.log(
    performedBy,
    "data.anonymized",
    "tenant",
    tenantId,
    null,
    { affectedCustomers: updatedCustomers.length },
    null
  );

  return { affectedCustomers: updatedCustomers.length };
};

module.exports = dataAnonymizationDAO;
