export interface NavItem {
  routeName: string
  text: string
  icon: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
  requiresPermission?: string
  requiresFeature?: string
  requiresVertical?: string
  tenantOnly?: boolean
  section?: string
}

export const guestNavItems: NavItem[] = [
  { routeName: 'home', text: 'Home', icon: 'mdi:home' },
  { routeName: 'new-reservation', text: 'New Reservation', icon: 'mdi:calendar-plus' },
]

export const authenticatedNavItems: NavItem[] = [
  { routeName: 'tenant-landing', text: 'Dashboard', icon: 'mdi:view-dashboard', requiresAuth: true },
  { routeName: 'reservations', text: 'Reservations', icon: 'mdi:format-list-bulleted', requiresAuth: true, requiresFeature: 'dine_in' },
  { routeName: 'table-management', text: 'Tables', icon: 'mdi:table', requiresAuth: true, requiresFeature: 'table_management' },
  { routeName: 'schedule', text: 'Schedule', icon: 'mdi:calendar', requiresAuth: true, requiresFeature: 'staff_scheduling' },
  { routeName: 'calendar', text: 'Calendar', icon: 'mdi:calendar', requiresAuth: true, requiresFeature: 'dine_in' },
  { routeName: 'staff-management', text: 'Staff', icon: 'mdi:account-group', requiresAuth: true, requiresFeature: 'staff_scheduling' },
  { routeName: 'floor-plan', text: 'Floor Plan', icon: 'mdi:map', requiresAuth: true, requiresFeature: 'table_management' },
  { routeName: 'floorplan-editor', text: 'Floor Plan Editor', icon: 'mdi:map-edit', requiresAuth: true, requiresPermission: 'manage_tables', requiresFeature: 'table_management' },
  { routeName: 'waitlist', text: 'Waitlist', icon: 'mdi:clock', requiresAuth: true, requiresFeature: 'waitlist' },
  { routeName: 'reports', text: 'Reports', icon: 'mdi:chart-bar', requiresAuth: true },
  { routeName: 'heatmap', text: 'Heatmap', icon: 'mdi:chart-area', requiresAuth: true, requiresFeature: 'dine_in' },
  { routeName: 'payments', text: 'Payments', icon: 'mdi:currency-usd', requiresAuth: true },
  { routeName: 'revenue-report', text: 'Revenue', icon: 'mdi:trending-up', requiresAuth: true },
  { routeName: 'search', text: 'Search', icon: 'mdi:magnify', requiresAuth: true },
  { routeName: 'about', text: 'About', icon: 'mdi:information', requiresAuth: true },
  { routeName: 'appointments', text: 'Appointments', icon: 'mdi:calendar-check', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-calendar', text: 'Calendar', icon: 'mdi:calendar-month', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-schedule', text: 'Hours', icon: 'mdi:clock-outline', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-walkins', text: 'Walk-ins', icon: 'mdi:account-clock', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-shifts', text: 'Staff Shifts', icon: 'mdi:calendar-clock', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'stations', text: 'Stations', icon: 'mdi:chair-rolling', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'station-map', text: 'Station Map', icon: 'mdi:map', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-services', text: 'Services', icon: 'mdi:content-cut', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-settings', text: 'Salon Settings', icon: 'mdi:cog', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-reports', text: 'Reports', icon: 'mdi:chart-bar', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-recurring', text: 'Recurring', icon: 'mdi:repeat', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-clients', text: 'Clients', icon: 'mdi:account-group', requiresAuth: true, requiresVertical: 'salon' },
]

export const adminNavItems: NavItem[] = [
  { routeName: 'super-admin-overview', text: 'Overview', icon: 'mdi:view-dashboard', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'admin-settings', text: 'Settings', icon: 'mdi:cog', requiresAuth: true, requiresAdmin: true },
  { routeName: 'tenant-dashboard', text: 'Tenants', icon: 'mdi:account-group', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'plans-management', text: 'Pricing', icon: 'mdi:tag-outline', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-payment-dashboard', text: 'Payments', icon: 'mdi:currency-usd', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-usage', text: 'Usage', icon: 'mdi:chart-bar', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-revenue', text: 'Revenue', icon: 'mdi:trending-up', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-bulk-actions', text: 'Bulk Actions', icon: 'mdi:check-all', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'billing-email-templates', text: 'Billing Emails', icon: 'mdi:email-send', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-audit-log', text: 'Audit Log', icon: 'mdi:clipboard-list', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-notifications', text: 'Notifications', icon: 'mdi:bell', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'platform-benchmarks', text: 'Benchmarks', icon: 'mdi:chart-box', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'tenant-dsar', text: 'DSAR', icon: 'mdi:shield-account', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true },
  { routeName: 'role-management', text: 'Roles', icon: 'mdi:key', requiresAuth: true },
  { routeName: 'group-management', text: 'Groups', icon: 'mdi:account-multiple', requiresAuth: true },
  { routeName: 'audit-logs', text: 'Audit', icon: 'mdi:file-document-text', requiresAuth: true },
  { routeName: 'email-templates', text: 'Email Templates', icon: 'mdi:email', requiresAuth: true, requiresAdmin: true },
]
