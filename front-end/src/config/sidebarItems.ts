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
  platformOnly?: boolean
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
  { routeName: 'salon-packages', text: 'Packages', icon: 'mdi:package-variant-closed', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-gift-cards', text: 'Gift Cards', icon: 'mdi:gift', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-referrals', text: 'Referrals', icon: 'mdi:account-group', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-locations', text: 'Locations', icon: 'mdi:map-marker-multiple', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-inventory', text: 'Inventory', icon: 'mdi:warehouse', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-expenses', text: 'Expenses', icon: 'mdi:cash-minus', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-pricing', text: 'Pricing Rules', icon: 'mdi:tag-outline', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-settings', text: 'Salon Settings', icon: 'mdi:cog', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-reports', text: 'Reports', icon: 'mdi:chart-bar', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-recurring', text: 'Recurring', icon: 'mdi:repeat', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-clients', text: 'Clients', icon: 'mdi:account-group', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-dashboard', text: 'Dashboard', icon: 'mdi:view-dashboard', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-marketing', text: 'Marketing', icon: 'mdi:bullhorn', requiresAuth: true, requiresVertical: 'salon' },
  { routeName: 'salon-gallery', text: 'Gallery', icon: 'mdi:image-multiple', requiresAuth: true, requiresVertical: 'salon' },
]

export const adminNavItems: NavItem[] = [
  { routeName: 'super-admin-overview', text: 'Overview', icon: 'mdi:view-dashboard', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'admin-settings', text: 'Settings', icon: 'mdi:cog', requiresAuth: true, requiresAdmin: true, platformOnly: true },
  { routeName: 'tenant-dashboard', text: 'Tenants', icon: 'mdi:account-group', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'plans-management', text: 'Pricing', icon: 'mdi:tag-outline', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-payment-dashboard', text: 'Payments', icon: 'mdi:currency-usd', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-usage', text: 'Usage', icon: 'mdi:chart-bar', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-revenue', text: 'Revenue', icon: 'mdi:trending-up', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-bulk-actions', text: 'Bulk Actions', icon: 'mdi:check-all', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-financial', text: 'Financial', icon: 'mdi:currency-usd', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-feature-flags', text: 'Feature Flags', icon: 'mdi:flag', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-integrations', text: 'Integrations', icon: 'mdi:link', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-impersonation', text: 'Impersonation', icon: 'mdi:account-convert', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-analytics', text: 'Analytics', icon: 'mdi:chart-box', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'billing-email-templates', text: 'Billing Emails', icon: 'mdi:email-send', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-backups', text: 'Backups', icon: 'mdi:database', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-maintenance', text: 'Maintenance', icon: 'mdi:wrench', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-trust-safety', text: 'Trust & Safety', icon: 'mdi:shield-check', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-support-chat', text: 'Support Chat', icon: 'mdi:chat', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-monitoring', text: 'Monitoring', icon: 'mdi:chart-line', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-vertical-analytics', text: 'Verticals', icon: 'mdi:view-grid', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-data-retention', text: 'Data Retention', icon: 'mdi:database-clock', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-audit-log', text: 'Audit Log', icon: 'mdi:clipboard-list', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-incidents', text: 'Incidents', icon: 'mdi:alert-circle', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-suspicious-activity', text: 'Suspicious Activity', icon: 'mdi:account-alert', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-sub-processors', text: 'Sub-Processors', icon: 'mdi:cloud-outline', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-debug', text: 'Debug Tools', icon: 'mdi:bug', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-status', text: 'System Status', icon: 'mdi:heart-pulse', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-migration', text: 'Migrations', icon: 'mdi:database-sync', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-change-management', text: 'Change Management', icon: 'mdi:clipboard-text-clock', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-postmortems', text: 'Postmortems', icon: 'mdi:post-outline', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-notifications', text: 'Notifications', icon: 'mdi:bell', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'platform-benchmarks', text: 'Benchmarks', icon: 'mdi:chart-box', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'tenant-dsar', text: 'DSAR', icon: 'mdi:shield-account', requiresAuth: true, requiresPermission: 'manage_tenants', tenantOnly: true, platformOnly: true },
  { routeName: 'role-management', text: 'Roles', icon: 'mdi:key', requiresAuth: true },
  { routeName: 'group-management', text: 'Groups', icon: 'mdi:account-multiple', requiresAuth: true },
  { routeName: 'audit-logs', text: 'Audit', icon: 'mdi:file-document-text', requiresAuth: true },
  { routeName: 'email-templates', text: 'Email Templates', icon: 'mdi:email', requiresAuth: true, requiresAdmin: true },
]
