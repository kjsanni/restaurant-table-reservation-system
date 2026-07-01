import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { title: "Home" },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { title: "Login" },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { title: "Register" },
    },
    {
      path: "/reservations",
      name: "reservations",
      component: () => import("../views/ReservationsView.vue"),
      meta: { requiresAuth: true, title: "Reservations" },
    },
    {
      path: "/new-reservation",
      name: "new-reservation",
      component: () => import("../views/NewReservationView.vue"),
      meta: { requiresAuth: true, title: "New Reservation" },
    },
    {
      path: "/search",
      name: "search",
      component: () => import("../views/SearchView.vue"),
      meta: { requiresAuth: true, title: "Search Reservations" },
    },
    {
      path: "/add-table",
      redirect: "/tables/manage",
    },
    {
      path: "/admin/settings",
      name: "admin-settings",
      component: () => import("../views/AdminSettingsView.vue"),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: "Admin Settings",
      },
    },
    {
      path: "/schedule",
      name: "schedule",
      component: () => import("../views/ScheduleView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_schedule",
        title: "Restaurant Schedule",
      },
    },
    {
      path: "/calendar",
      name: "calendar",
      component: () => import("../views/CalendarView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_schedule",
        title: "Schedule Calendar",
      },
    },
    {
      path: "/floor-plan",
      name: "floor-plan",
      component: () => import("../views/FloorPlanView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_tables",
        title: "Floor Plan",
      },
    },
    {
      path: "/reports",
      name: "reports",
      component: () => import("../views/ReportView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "view_reservations",
        title: "Reports & Export",
      },
    },
    {
      path: "/heatmap",
      name: "heatmap",
      component: () => import("../views/HeatmapView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "view_reservations",
        title: "Reservation Heatmap",
      },
    },
    {
      path: "/tables/manage",
      name: "table-management",
      component: () => import("../views/TableManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_tables",
        title: "Table Management",
      },
    },
    {
      path: "/staff/manage",
      name: "staff-management",
      component: () => import("../views/StaffManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_staff",
        title: "Staff Management",
      },
    },
    {
      path: "/roles/manage",
      name: "role-management",
      component: () => import("../views/RoleManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_roles",
        title: "Role Management",
      },
    },
    {
      path: "/groups/manage",
      name: "group-management",
      component: () => import("../views/GroupManagementView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_groups",
        title: "Group Management",
      },
    },
    {
      path: "/admin/payments",
      name: "payment-dashboard",
      component: () => import("../views/PaymentDashboardView.vue"),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: "Payment Dashboard",
      },
    },
    {
      path: "/waitlist",
      name: "waitlist",
      component: () => import("../views/WaitlistView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "manage_tables",
        title: "Waitlist & Queue",
      },
    },
    {
      path: "/audit-logs",
      name: "audit-logs",
      component: () => import("../views/AuditLogView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "view_audit_logs",
        title: "Audit Logs",
      },
    },
    {
      path: "/admin/customers/:id",
      name: "customer-profile",
      component: () => import("../views/CustomerProfileView.vue"),
      meta: {
        requiresAuth: true,
        requiresPermission: "view_reservations",
        title: "Customer Profile",
      },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { title: "About" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
      meta: { title: "Page Not Found" },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (
    to.meta.requiresAuth &&
    !authStore.isAuthenticated &&
    !authStore.isLoading
  ) {
    next({ name: "login" });
  } else if (to.meta.requiresAdmin && authStore.user?.role !== "admin") {
    next({ name: "home" });
  } else if (
    to.meta.requiresPermission &&
    !authStore.isLoading &&
    !authStore.user?.permissions?.[to.meta.requiresPermission]
  ) {
    next({ name: "home" });
  } else {
    next();
  }
});

export default router;
