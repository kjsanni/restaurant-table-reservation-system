export const paymentOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Deposit", value: "deposit" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
];

import { brandColors } from "@/theme/colors";

export const getPaymentStatusColor = (status) => {
  const colors = {
    paid: brandColors.earth500,
    partial: brandColors.accent500,
    deposit: brandColors.sky500,
    unpaid: brandColors.neutral500,
  };
  return colors[status] || brandColors.neutral500;
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
