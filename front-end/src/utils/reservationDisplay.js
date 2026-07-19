import { brandColors } from "@/theme/colors";

const STATUS_COLORS = {
  seated: brandColors.earth500,
  cancelled: brandColors.rose500,
  missed: brandColors.accent500,
};

const statusColor = (status) => STATUS_COLORS[status] || brandColors.sky500;

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
