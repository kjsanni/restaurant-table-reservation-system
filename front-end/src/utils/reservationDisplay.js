const STATUS_COLORS = {
  seated: "#22c55e",
  cancelled: "#ef4444",
  missed: "#f59e0b",
};

const statusColor = (status) => STATUS_COLORS[status] || "#3b82f6";

const shortName = (name) => {
  if (!name) return "Guest";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + "." + parts[1][0] + ".";
  }
  return parts[0].slice(0, 8);
};

export { statusColor, shortName };
export default { statusColor, shortName };
