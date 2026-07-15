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
  { routeName: 'login', text: 'Login', icon: 'mdi:login' },
  { routeName: 'new-reservation', text: 'New Reservation', icon: 'mdi:calendar-plus' },
]

export const authenticatedNavItems: NavItem[] = [
  { routeName: 'reservations', text: 'Reservations', icon: 'mdi:format-list-bulleted', requiresAuth: true },
  { routeName: 'table-management', text: 'Tables', icon: 'mdi:table', requiresAuth: true },
  { routeName: 'schedule', text: 'Schedule', icon: 'mdi:calendar', requiresAuth: true },
  { routeName: 'calendar', text: 'Calendar', icon: 'mdi:calendar', requiresAuth: true },
  { routeName: 'staff-management', text: 'Staff', icon: 'mdi:account-group', requiresAuth: true },
  { routeName: 'floor-plan', text: 'Floor Plan', icon: 'mdi:map', requiresAuth: true },
  { routeName: 'waitlist', text: 'Waitlist', icon: 'mdi:clock', requiresAuth: true },
  { routeName: 'reports', text: 'Reports', icon: 'mdi:chart-bar', requiresAuth: true },
  { routeName: 'heatmap', text: 'Heatmap', icon: 'mdi:chart-area', requiresAuth: true },
]

export const adminNavItems: NavItem[] = [
  { routeName: 'admin-settings', text: 'Settings', icon: 'mdi:cog', requiresAuth: true, requiresAdmin: true },
  { routeName: 'role-management', text: 'Roles', icon: 'mdi:key', requiresAuth: true },
  { routeName: 'group-management', text: 'Groups', icon: 'mdi:account-group', requiresAuth: true },
  { routeName: 'payment-dashboard', text: 'Payments', icon: 'mdi:currency-usd', requiresAuth: true, requiresAdmin: true },
  { routeName: 'audit-logs', text: 'Audit', icon: 'mdi:file-document-text', requiresAuth: true },
]
