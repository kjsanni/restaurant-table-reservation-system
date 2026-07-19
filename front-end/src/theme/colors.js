/**
 * Centralized brand color tokens for JS-driven contexts (charts, status dots,
 * tags, badges). Keep these in sync with front-end/src/assets/base.css so the
 * whole app stays on one warm, restaurant-brand palette — in both single-tenant
 * and multi-tenant (tenant-branded) modes.
 */

// Brand-aligned palette (mirrors CSS vars in base.css)
export const brandColors = {
  brand900: "#1a1410",
  brand800: "#2d221c",
  brand700: "#4a352b",
  brand600: "#6b4a3a",
  brand500: "#8c5e4a",
  brand400: "#b87a62",
  brand300: "#d9a086",
  brand200: "#e8c4b5",
  brand100: "#f3ddd3",
  brand50: "#faf6f3",
  accent600: "#b45309",
  accent500: "#d97706",
  accent400: "#f59e0b",
  accent300: "#fbbf24",
  accent200: "#fcd34d",
  accent100: "#fef3c7",
  accent50: "#fffbeb",
  earth600: "#365314",
  earth500: "#4d7c0f",
  earth400: "#65a30d",
  earth200: "#d9f99d",
  earth100: "#ecfccb",
  earth50: "#f7fee7",
  sky600: "#1e40af",
  sky500: "#3b82f6",
  sky400: "#60a5fa",
  sky200: "#bfdbfe",
  sky100: "#dbeafe",
  rose600: "#e11d48",
  rose500: "#f43f5e",
  rose200: "#fecdd3",
  rose100: "#ffe4e6",
  neutral900: "#312e2a",
  neutral800: "#4a4540",
  neutral700: "#645d54",
  neutral600: "#7d766c",
  neutral500: "#9a9389",
  neutral400: "#b8b2a8",
  neutral300: "#d6d1c9",
  neutral200: "#e7e4de",
  neutral100: "#f3f1ed",
  neutral50: "#faf9f7",
  white: "#ffffff",
};

// Soft (background) + ink (text) pairs for status pills/badges
export const statusColorMap = {
  success: { bg: brandColors.earth100, text: brandColors.earth600 },
  info: { bg: brandColors.sky100, text: brandColors.sky600 },
  warning: { bg: brandColors.accent100, text: brandColors.accent600 },
  danger: { bg: brandColors.rose100, text: brandColors.rose600 },
  muted: { bg: brandColors.neutral100, text: brandColors.neutral600 },
  brand: { bg: brandColors.brand100, text: brandColors.brand800 },
  accent: { bg: brandColors.accent100, text: brandColors.accent600 },
};

// Reservation status -> brand-aligned hex (used for dots, chips, legends)
export const reservationStatusColors = {
  confirmed: brandColors.accent500,
  pending: brandColors.sky500,
  seated: brandColors.earth500,
  completed: brandColors.neutral500,
  cancelled: brandColors.rose500,
  no_show: brandColors.rose600,
  active: brandColors.accent500,
  draft: brandColors.neutral500,
};

// Generic status colors for tenant/subscription badges
export const subscriptionStatusColors = {
  active: { bg: brandColors.earth100, text: brandColors.earth600 },
  trialing: { bg: brandColors.sky100, text: brandColors.sky600 },
  past_due: { bg: brandColors.accent100, text: brandColors.accent600 },
  suspended: { bg: brandColors.rose100, text: brandColors.rose600 },
  cancelled: { bg: brandColors.neutral100, text: brandColors.neutral600 },
};

// Table/server overlay dot palette (brand-aligned rainbow)
export const tableDotPalette = [
  brandColors.accent500, // amber
  brandColors.earth500, // green
  brandColors.rose500, // rose
  brandColors.sky500, // blue
  brandColors.accent600, // deep amber
  brandColors.brand600, // brown
  brandColors.earth600, // olive
  brandColors.neutral700, // stone
];

// Chart series palette (brand-aligned)
export const chartPalette = [
  brandColors.accent500,
  brandColors.earth500,
  brandColors.sky500,
  brandColors.rose500,
  brandColors.brand500,
  brandColors.neutral500,
];

// Table occupancy legend palette
export const tableStatusColors = {
  free: { bg: brandColors.neutral100, text: brandColors.neutral600 },
  occupied: { bg: brandColors.accent100, text: brandColors.accent600 },
  reserved: { bg: brandColors.sky100, text: brandColors.sky600 },
  blocked: { bg: brandColors.neutral200, text: brandColors.neutral700 },
};
