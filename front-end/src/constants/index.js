export const paymentOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Deposit", value: "deposit" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
];

export const getPaymentStatusColor = (status) => {
  const colors = {
    paid: "#22c55e",
    partial: "#f59e0b",
    deposit: "#3b82f6",
    unpaid: "#9ca3af",
  };
  return colors[status] || "#9ca3af";
};

export const getPaymentStatusLabel = (status) => {
  const labels = {
    paid: "PAID",
    partial: "PARTIAL",
    deposit: "DEPOSIT",
    unpaid: "UNPAID",
  };
  return labels[status] || status?.toUpperCase() || "";
};
