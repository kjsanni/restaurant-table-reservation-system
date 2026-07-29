const waitlistDAO = require("../DAOs/waitlist.dao");
const reservationDAO = require("../DAOs/reservation.dao");

const buildCustomerDetails = (user) => {
  const email = user?.email;
  const phone = user?.phone || "";
  const nameParts = (user?.username || email || "Customer")
    .split(" ")
    .filter(Boolean);
  const firstName = nameParts.shift() || (email ? email.split("@")[0] : "Customer");
  const lastName = nameParts.join(" ") || "-";
  return { email, phone, firstName, lastName };
};

const getCustomerWaitlistHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(200).json({ success: true, entries: [] });
    }

    const entries = await waitlistDAO.getWaitingList({ customerId: customer.id }, req.tenant?.id);
    return res.status(200).json({ success: true, entries });
  } catch (err) {
    console.error("getCustomerWaitlistHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load waitlist" });
  }
};

const joinWaitlistHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(400).json({ success: false, message: "No customer profile available" });
    }

    const { partySize, desiredTime, notes } = req.body;
    const validPartySize = Number.isInteger(partySize) && partySize > 0 && partySize <= 50 ? partySize : 2;
    const entry = await waitlistDAO.createEntry({
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      partySize: validPartySize,
      phone: customer.phone,
      email: customer.email,
      desiredTime,
      notes,
      status: "waiting",
      customerId: customer.id,
    }, req.tenant?.id);

    return res.status(201).json({ success: true, message: "Added to waitlist", entry });
  } catch (err) {
    console.error("joinWaitlistHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to join waitlist" });
  }
};

const cancelWaitlistEntryHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    const entry = await waitlistDAO.findById(req.params.id, req.tenant?.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Waitlist entry not found" });
    }
    if (entry.customerId !== customer.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this waitlist entry" });
    }

    const updated = await waitlistDAO.markCancelled(req.params.id, req.tenant?.id);
    return res.status(200).json({ success: true, message: "Waitlist entry cancelled", entry: updated });
  } catch (err) {
    console.error("cancelWaitlistEntryHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel waitlist entry" });
  }
};

module.exports = {
  getCustomerWaitlistHandler,
  joinWaitlistHandler,
  cancelWaitlistEntryHandler,
};
