export interface NavItem {
  routeName: string
  text: string
  icon: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
  requiresPermission?: string
  section?: string
}

export const guestNavItems: NavItem[] = [
  { routeName: 'home', text: 'Home', icon: 'mdi:home' },
  { routeName: 'new-reservation', text: 'New Reservation', icon: 'mdi:calendar-plus' },
]

export const authenticatedNavItems: NavItem[] = [
  { routeName: 'tenant-landing', text: 'Dashboard', icon: 'mdi:view-dashboard', requiresAuth: true },
  { routeName: 'reservations', text: 'Reservations', icon: 'mdi:format-list-bulleted', requiresAuth: true },
  { routeName: 'table-management', text: 'Tables', icon: 'mdi:table', requiresAuth: true },
  { routeName: 'schedule', text: 'Schedule', icon: 'mdi:calendar', requiresAuth: true },
  { routeName: 'calendar', text: 'Calendar', icon: 'mdi:calendar', requiresAuth: true },
  { routeName: 'staff-management', text: 'Staff', icon: 'mdi:account-group', requiresAuth: true },
  { routeName: 'floor-plan', text: 'Floor Plan', icon: 'mdi:map', requiresAuth: true },
  { routeName: 'floorplan-editor', text: 'Floor Plan Editor', icon: 'mdi:map-edit', requiresAuth: true, requiresPermission: 'manage_tables' },
  { routeName: 'waitlist', text: 'Waitlist', icon: 'mdi:clock', requiresAuth: true },
  { routeName: 'reports', text: 'Reports', icon: 'mdi:chart-bar', requiresAuth: true },
  { routeName: 'heatmap', text: 'Heatmap', icon: 'mdi:chart-area', requiresAuth: true },
]

export const adminNavItems: NavItem[] = [
  { routeName: 'super-admin-overview', text: 'Overview', icon: 'mdi:view-dashboard', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'admin-settings', text: 'Settings', icon: 'mdi:cog', requiresAuth: true, requiresAdmin: true },
  { routeName: 'tenant-dashboard', text: 'Tenants', icon: 'mdi:account-group', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'plans-management', text: 'Pricing', icon: 'mdi:tag-outline', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-payment-dashboard', text: 'Payments', icon: 'mdi:currency-usd', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-usage', text: 'Usage', icon: 'mdi:chart-bar', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-revenue', text: 'Revenue', icon: 'mdi:trending-up', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-bulk-actions', text: 'Bulk Actions', icon: 'mdi:check-all', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'billing-email-templates', text: 'Billing Emails', icon: 'mdi:email-send', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-audit-log', text: 'Audit Log', icon: 'mdi:clipboard-list', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'platform-notifications', text: 'Notifications', icon: 'mdi:bell', requiresAuth: true, requiresPermission: 'manage_tenants' },
  { routeName: 'role-management', text: 'Roles', icon: 'mdi:key', requiresAuth: true },
  { routeName: 'group-management', text: 'Groups', icon: 'mdi:account-multiple', requiresAuth: true },
  { routeName: 'audit-logs', text: 'Audit', icon: 'mdi:file-document-text', requiresAuth: true },
  { routeName: 'email-templates', text: 'Email Templates', icon: 'mdi:email', requiresAuth: true, requiresAdmin: true },
]
