<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import SidebarNavItem from "@/components/SidebarNavItem.vue";

import HomeIcon from "~icons/fluent/home-16-regular";
import PlusIcon from "~icons/fluent/add-16-regular";
import CardListIcon from "~icons/bi/card-list";
import TableIcon from "~icons/fluent/table-16-regular";
import CalendarIcon from "~icons/fluent/calendar-day-16-regular";
import StaffIcon from "~icons/fluent/people-16-regular";
import SettingsIcon from "~icons/fluent/settings-16-regular";
import RolesIcon from "~icons/fluent/key-16-regular";
import GroupIcon from "~icons/fluent/people-team-16-regular";
import PaymentsIcon from "~icons/fluent/money-16-regular";
import AuditIcon from "~icons/fluent/document-text-16-regular";
import LogoutIcon from "~icons/fluent/arrow-left-16-regular";
import LoginIcon from "~icons/fluent/person-16-regular";
import MenuIcon from "~icons/fluent/navigation-16-regular";
import ReportsIcon from "~icons/carbon/chart-bar";
import FloorPlanIcon from "~icons/fluent/navigation-16-regular";
import WaitlistIcon from "~icons/fluent/clock-16-regular";
import HeatmapIcon from "~icons/carbon/chart-area";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isMobile = ref(null);
const mobileOpen = ref(false);
const windowWidth = ref(null);
const isCollapsed = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

const isActive = (name) => route.name === name;

const checkWindowWidth = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value <= 768) {
    isMobile.value = true;
    isCollapsed.value = true;
    return;
  }
  isMobile.value = false;
  isCollapsed.value = false;
  mobileOpen.value = false;
  document.body.style.paddingLeft = "260px";
};

const toggleCollapse = () => {
  if (isMobile.value) return;
  isCollapsed.value = !isCollapsed.value;
  document.body.style.paddingLeft = isCollapsed.value ? "72px" : "260px";
};

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value;
};

const closeMobile = () => {
  mobileOpen.value = false;
};

const logout = () => {
  authStore.logout();
  router.push({ name: "home" });
  closeMobile();
};

onMounted(() => {
  window.addEventListener("resize", checkWindowWidth);
  checkWindowWidth();
  if (windowWidth.value > 768) {
    document.body.style.paddingLeft = "260px";
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkWindowWidth);
  document.body.style.paddingLeft = "";
});
</script>

<template>
  <aside
    :class="[
      'sidebar',
      { collapsed: isCollapsed, mobile: isMobile, open: mobileOpen },
    ]"
  >
    <div class="sidebar-header">
      <img
        class="logo"
        src="@/assets/images/logo.jpg"
        alt="Logo"
        @click="router.push({ name: 'home' })"
      />
      <span v-if="!isCollapsed" class="brand">Reservations</span>
      <button
        v-if="!isMobile"
        class="collapse-btn"
        @click="toggleCollapse"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <span class="collapse-icon" :class="{ rotated: !isCollapsed }">◀</span>
      </button>
      <button v-if="isMobile" class="close-btn" @click="toggleMobile">✕</button>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">
        <div v-if="!isCollapsed" class="section-title">Guest</div>
        <SidebarNavItem
          route-name="home"
          text="Home"
          :is-active="isActive('home')"
        >
          <template #icon>
            <HomeIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="new-reservation"
          text="New Reservation"
          :is-active="isActive('new-reservation')"
        >
          <template #icon>
            <PlusIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          v-if="isAuthenticated"
          route-name="reservations"
          text="Reservations"
          :is-active="isActive('reservations')"
        >
          <template #icon>
            <CardListIcon />
          </template>
        </SidebarNavItem>
      </div>

      <div class="nav-section">
        <div v-if="!isCollapsed" class="section-title">Staff</div>
        <SidebarNavItem
          route-name="table-management"
          text="Tables"
          :is-active="isActive('table-management')"
        >
          <template #icon>
            <TableIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="schedule"
          text="Schedule"
          :is-active="isActive('schedule')"
        >
          <template #icon>
            <CalendarIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="calendar"
          text="Calendar"
          :is-active="isActive('calendar')"
        >
          <template #icon>
            <CalendarIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="staff-management"
          text="Staff"
          :is-active="isActive('staff-management')"
        >
          <template #icon>
            <StaffIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="floor-plan"
          text="Floor Plan"
          :is-active="isActive('floor-plan')"
        >
          <template #icon>
            <FloorPlanIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="waitlist"
          text="Waitlist"
          :is-active="isActive('waitlist')"
        >
          <template #icon>
            <WaitlistIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="reports"
          text="Reports"
          :is-active="isActive('reports')"
        >
          <template #icon>
            <ReportsIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="heatmap"
          text="Heatmap"
          :is-active="isActive('heatmap')"
        >
          <template #icon>
            <HeatmapIcon />
          </template>
        </SidebarNavItem>
      </div>

      <div class="nav-section">
        <div v-if="!isCollapsed" class="section-title">Admin</div>
        <SidebarNavItem
          route-name="admin-settings"
          text="Settings"
          :requires-admin="true"
          :is-active="isActive('admin-settings')"
        >
          <template #icon>
            <SettingsIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="role-management"
          text="Roles"
          :is-active="isActive('role-management')"
        >
          <template #icon>
            <RolesIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="group-management"
          text="Groups"
          :is-active="isActive('group-management')"
        >
          <template #icon>
            <GroupIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="payment-dashboard"
          text="Payments"
          :requires-admin="true"
          :is-active="isActive('payment-dashboard')"
        >
          <template #icon>
            <PaymentsIcon />
          </template>
        </SidebarNavItem>
        <SidebarNavItem
          route-name="audit-logs"
          text="Audit"
          :is-active="isActive('audit-logs')"
        >
          <template #icon>
            <AuditIcon />
          </template>
        </SidebarNavItem>
      </div>
    </nav>

    <div class="sidebar-footer">
      <template v-if="isAuthenticated">
        <div v-if="!isCollapsed" class="user-info">
          <span class="username">{{ user?.username }}</span>
          <span class="role-badge">{{ user?.role }}</span>
        </div>
        <button class="logout-btn" @click="logout" title="Logout">
          <LogoutIcon />
        </button>
      </template>
      <template v-else>
        <button class="login-btn" @click="router.push({ name: 'login' })">
          <LoginIcon />
          <span v-if="!isCollapsed">Login</span>
        </button>
      </template>
    </div>

    <Transition name="fade">
      <div
        v-if="isMobile && mobileOpen"
        class="overlay"
        @click="closeMobile"
      ></div>
    </Transition>
  </aside>

  <button
    v-if="isMobile && !mobileOpen"
    class="mobile-trigger"
    @click="toggleMobile"
  >
    <MenuIcon />
  </button>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  width: 260px;
  background: linear-gradient(180deg, #04030f 0%, #0d0b1a 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 70px;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.brand {
  font-family: "Inter-Bold";
  font-size: 17px;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: -0.4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.collapse-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-radius: 6px;
}

.collapse-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.collapse-icon {
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 10px;
  line-height: 1;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.6px;
  color: rgba(255, 255, 255, 0.4);
  padding: 14px 10px 6px;
  white-space: nowrap;
}

.sidebar.collapsed .section-title {
  display: none;
}

.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  min-width: 0;
}

.username {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  font-size: 11px;
  color: rgba(59, 130, 246, 0.9);
  font-family: "Inter-Light";
  text-transform: capitalize;
  white-space: nowrap;
}

.logout-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  flex-shrink: 0;
  border-radius: 8px;
}

.logout-btn:hover {
  color: #ffffff;
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  white-space: nowrap;
}

.login-btn:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #ffffff;
}

.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 40;
  backdrop-filter: blur(4px);
}

.mobile-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 12px;
  left: 12px;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, #04030f 0%, #1a1530 100%);
  color: #ffffff;
  cursor: pointer;
  z-index: 45;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.mobile-trigger:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.mobile-trigger :deep(svg) {
  width: 22px;
  height: 22px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  transition: all 0.2s;
  margin-left: auto;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease-out;
}

@media screen and (min-width: 769px) {
  .mobile-trigger {
    display: none;
  }
}

@media screen and (min-width: 1024px) {
  .sidebar {
    width: 260px;
  }
  .sidebar.collapsed {
    width: 72px;
  }
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 280px;
    transform: translateX(-100%);
  }

  .sidebar.mobile.open {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 280px;
  }

  body {
    padding-left: 0 !important;
  }
}
</style>
