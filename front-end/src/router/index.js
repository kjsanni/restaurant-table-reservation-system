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
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
    {
      path: "/reservations",
      name: "reservations",
      component: () => import("../views/ReservationsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/new-reservation",
      name: "new-reservation",
      component: () => import("../views/NewReservationView.vue"),
    },
    {
      path: "/admin/settings",
      name: "admin-settings",
      component: () => import("../views/AdminSettingsView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/schedule",
      name: "schedule",
      component: () => import("../views/ScheduleView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
    },
    {
      path: "/calendar",
      name: "calendar",
      component: () => import("../views/CalendarView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
    },
    {
      path: "/floor-plan",
      name: "floor-plan",
      component: () => import("../views/FloorPlanView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tables" },
    },
    {
      path: "/reports",
      name: "reports",
      component: () => import("../views/ReportView.vue"),
      meta: { requiresAuth: true, requiresPermission: "view_reservations" },
    },
    {
      path: "/heatmap",
      name: "heatmap",
      component: () => import("../views/HeatmapView.vue"),
      meta: { requiresAuth: true, requiresPermission: "view_reservations" },
    },
    {
      path: "/tables/manage",
      name: "table-management",
      component: () => import("../views/TableManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tables" },
    },
    {
      path: "/staff/manage",
      name: "staff-management",
      component: () => import("../views/StaffManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_staff" },
    },
    {
      path: "/roles/manage",
      name: "role-management",
      component: () => import("../views/RoleManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_roles" },
    },
    {
      path: "/groups/manage",
      name: "group-management",
      component: () => import("../views/GroupManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_groups" },
    },
    {
      path: "/admin/payments",
      name: "payment-dashboard",
      component: () => import("../views/PaymentDashboardView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/waitlist",
      name: "waitlist",
      component: () => import("../views/WaitlistView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tables" },
    },
    {
      path: "/audit-logs",
      name: "audit-logs",
      component: () => import("../views/AuditLogView.vue"),
      meta: { requiresAuth: true, requiresPermission: "view_audit_logs" },
    },
    {
      path: "/admin/customers/:id",
      name: "customer-profile",
      component: () => import("../views/CustomerProfileView.vue"),
      meta: { requiresAuth: true, requiresPermission: "view_reservations" },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
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
