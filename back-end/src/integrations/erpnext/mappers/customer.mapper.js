"use strict";

const mapCustomerToErpnext = (customer) => {
  return {
    first_name: customer.firstName || "",
    last_name: customer.lastName || "",
    email_id: customer.email || "",
    mobile_no: customer.phone || "",
    customer_group: "RTRS Customers",
    territory: "All Territories",
    customer_type: "Individual",
    tax_id: customer.taxId || "",
    credit_limit: 0,
    payment_terms: "",
    language: customer.locale || "en",
  };
};

const mapReservationToInvoice = (reservation, tenant) => {
  const items = [
    {
      item_code: "RTRS Reservation",
      qty: 1,
      rate: parseFloat(reservation.expectedTotal || 0),
      amount: parseFloat(reservation.expectedTotal || 0),
      description: `Reservation for ${reservation.people} guest(s) on ${reservation.resDate} at ${reservation.resTime}`,
    },
  ];

  return {
    doctype: "Sales Invoice",
    customer: "",
    customer_name: `${reservation.customer?.firstName || ""} ${reservation.customer?.lastName || ""}`.trim(),
    posting_date: reservation.resDate,
    due_date: reservation.resDate,
    company: tenant.name,
    currency: tenant.currency || "GHS",
    items: items,
    total: parseFloat(reservation.expectedTotal || 0),
    grand_total: parseFloat(reservation.expectedTotal || 0),
    base_total: parseFloat(reservation.expectedTotal || 0),
    base_grand_total: parseFloat(reservation.expectedTotal || 0),
    status: "Draft",
    source: reservation.source || "web",
    rtrs_reservation_id: reservation.id,
    rtrs_tenant_id: tenant.id,
  };
};

const mapAppointmentToInvoice = (appointment, tenant, service) => {
  const rate = parseFloat(service?.price || appointment.amount || 0);
  const items = [
    {
      item_code: "RTRS Salon Appointment",
      qty: 1,
      rate,
      amount: rate,
      description: `Salon appointment: ${service?.name || "Service"} on ${appointment.start}`,
    },
  ];

  return {
    doctype: "Sales Invoice",
    customer: "",
    customer_name: `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim(),
    posting_date: appointment.start ? new Date(appointment.start).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    due_date: appointment.start ? new Date(appointment.start).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    company: tenant.name,
    currency: tenant.currency || "GHS",
    items,
    total: rate,
    grand_total: rate,
    base_total: rate,
    base_grand_total: rate,
    status: "Draft",
    source: appointment.source || "web",
    rtrs_appointment_id: appointment.id,
    rtrs_tenant_id: tenant.id,
  };
};

const mapPaymentToErpnext = (payment, reservation) => {
  return {
    doctype: "Payment Entry",
    payment_type: "Receive",
    party_type: "Customer",
    party: "",
    paid_amount: parseFloat(payment.amount || 0),
    received_amount: parseFloat(payment.amount || 0),
    currency: payment.currency || "GHS",
    source_exchange_rate: 1,
    target_exchange_rate: 1,
    reference_no: payment.reference || "",
    reference_date: payment.paidAt ? new Date(payment.paidAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    remarks: `Payment for reservation #${reservation?.id || "unknown"}`,
    rtrs_payment_id: payment.id,
    rtrs_reservation_id: reservation?.id,
  };
};

module.exports = {
  mapCustomerToErpnext,
  mapReservationToInvoice,
  mapAppointmentToInvoice,
  mapPaymentToErpnext,
};