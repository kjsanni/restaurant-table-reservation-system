export const supportStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] || status;
};

export const supportStatusClass = (status: string) => {
  const map: Record<string, string> = {
    open: "status-open",
    in_progress: "status-progress",
    resolved: "status-resolved",
    closed: "status-closed",
  };
  return map[status] || "status-open";
};

export const supportPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return map[priority] || priority;
};

export const supportCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    general: "General",
    billing: "Billing",
    technical: "Technical",
    onboarding: "Onboarding",
    salon: "Salon",
    restaurant: "Restaurant",
  };
  return map[category] || category;
};

export default {
  supportStatusLabel,
  supportStatusClass,
  supportPriorityLabel,
  supportCategoryLabel,
};
