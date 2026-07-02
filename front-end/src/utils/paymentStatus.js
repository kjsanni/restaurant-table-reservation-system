export const computePaymentStatus = ({ totalPaid, expectedTotal }) => {
  const paid = parseFloat(totalPaid) || 0;
  const total = parseFloat(expectedTotal) || 0;

  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
};
