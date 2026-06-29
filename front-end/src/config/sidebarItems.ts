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
  { routeName: 'home', text: 'Home', icon: 'va-home' },
  { routeName: 'new-reservation', text: 'New Reservation', icon: 'va-calendar-plus' },
]

export const authenticatedNavItems: NavItem[] = [
  { routeName: 'reservations', text: 'Reservations', icon: 'va-list', requiresAuth: true },
  { routeName: 'search', text: 'Search', icon: 'va-search', requiresAuth: true },
  { routeName: 'add-table', text: 'Add Table', icon: 'va-plus', requiresAuth: true, requiresPermission: 'manage_tables' },
  { routeName: 'table-management', text: 'Tables', icon: 'va-table', requiresAuth: true },
  { routeName: 'schedule', text: 'Schedule', icon: 'va-calendar', requiresAuth: true },
  { routeName: 'calendar', text: 'Calendar', icon: 'va-calendar', requiresAuth: true },
  { routeName: 'staff-management', text: 'Staff', icon: 'va-users', requiresAuth: true },
  { routeName: 'floor-plan', text: 'Floor Plan', icon: 'va-map', requiresAuth: true },
  { routeName: 'waitlist', text: 'Waitlist', icon: 'va-clock', requiresAuth: true },
  { routeName: 'reports', text: 'Reports', icon: 'va-chart-bar', requiresAuth: true },
  { routeName: 'heatmap', text: 'Heatmap', icon: 'va-chart-area', requiresAuth: true },
]

export const adminNavItems: NavItem[] = [
  { routeName: 'admin-settings', text: 'Settings', icon: 'va-cog', requiresAuth: true, requiresAdmin: true },
  { routeName: 'role-management', text: 'Roles', icon: 'va-key', requiresAuth: true },
  { routeName: 'group-management', text: 'Groups', icon: 'va-users-group', requiresAuth: true },
  { routeName: 'payment-dashboard', text: 'Payments', icon: 'va-money', requiresAuth: true, requiresAdmin: true },
  { routeName: 'audit-logs', text: 'Audit', icon: 'va-file-text', requiresAuth: true },
]
