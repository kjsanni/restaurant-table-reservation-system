<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { VaSidebarItem } from "vuestic-ui";
import gsap from "gsap";
import { useAuthStore } from "@/stores/auth";
import {
  superAdminSidebarNavItems,
  superAdminTopBarNavItems,
} from "@/config/sidebarItems";
import type { NavItem } from "@/config/sidebarItems";
import { useAnimations } from "@/composables/useAnimations";
import { useAdminLayout } from "@/composables/useAdminLayout";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import OfflineBanner from "@/components/OfflineBanner.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { fadeIn } = useAnimations();
const {
  collapsed,
  sidebarVisible,
  windowWidth,
  toggleSidebar,
  isAuthenticated,
  user,
  shouldShow,
} = useAdminLayout();

const { status, pendingCount } = useOnlineStatus();

let pageTween: gsap.core.Tween | null = null;
let leaveTween: gsap.core.Tween | null = null;

const beforeEnter = (el: Element) => {
  const node = el as HTMLElement;
  node.style.opacity = "0";
  node.style.transform = "translateY(8px)";
};

const onEnter = (el: Element, done: () => void) => {
  if (pageTween) pageTween.kill();
  pageTween = fadeIn(el, 0.28) as gsap.core.Tween | null;
  if (pageTween) {
    pageTween.eventCallback("onComplete", done);
  } else {
    done();
  }
};

const onLeave = (el: Element, done: () => void) => {
  if (leaveTween) leaveTween.kill();
  leaveTween = gsap.to(el, {
    opacity: 0,
    y: -8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done,
  }) as gsap.core.Tween | null;
};

const visibleNavItems = computed(() =>
  superAdminSidebarNavItems.filter(shouldShow)
);

const visibleTopBarItems = computed(() =>
  superAdminTopBarNavItems.filter(shouldShow)
);

const topBarGroups = computed(() => {
  const groups: Record<string, NavItem[]> = {};
  for (const item of visibleTopBarItems.value) {
    const section = item.section || "Other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
});

const topBarSectionOrder = [
  "Tenants",
  "Financial",
  "Integrations",
  "Security & Compliance",
  "Platform",
  "Support",
  "Data & Tools",
];

const orderedTopBarSections = computed(() => {
  const sections = Object.keys(topBarGroups.value);
  return sections.sort((a, b) => {
    const aIdx = topBarSectionOrder.indexOf(a);
    const bIdx = topBarSectionOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
});

const activeDropdown = ref<string | null>(null);

const toggleDropdown = (section: string) => {
  activeDropdown.value = activeDropdown.value === section ? null : section;
};

const dropdownBtnId = (section: string) =>
  `sa-dropdown-btn-${String(section)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
const dropdownPanelId = (section: string) =>
  `sa-dropdown-panel-${String(section)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

const DROPDOWN_FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getPanelItems = (section: string): HTMLElement[] => {
  const panel = document.getElementById(dropdownPanelId(section));
  if (!panel) return [];
  return Array.from(panel.querySelectorAll(DROPDOWN_FOCUSABLE));
};

const onDropdownBtnKeydown = (e: KeyboardEvent, section: string) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (activeDropdown.value !== section) activeDropdown.value = section;
    const items = getPanelItems(section);
    if (items.length) {
      e.preventDefault();
      items[0].focus();
    }
  }
};

const onDropdownPanelKeydown = (e: KeyboardEvent, section: string) => {
  const items = getPanelItems(section);
  if (!items.length) return;
  const idx = items.indexOf(document.activeElement as HTMLElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    (items[idx + 1] || items[0]).focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    (items[idx - 1] || items[items.length - 1]).focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    items[0].focus();
  } else if (e.key === "End") {
    e.preventDefault();
    items[items.length - 1].focus();
  } else if (e.key === "Tab") {
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

const onTopBarKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && activeDropdown.value) {
    e.preventDefault();
    const section = activeDropdown.value;
    activeDropdown.value = null;
    document.getElementById(dropdownBtnId(section))?.focus();
  }
};

const onGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    activeDropdown.value = null;
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    const searchInput = document.querySelector(
      'input[type="search"], input[placeholder*="Search"]'
    ) as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    router.push({ name: "tenant-dashboard" }).then(() => {
      setTimeout(() => {
        const createBtn = document.querySelector(
          '.btn-primary, button[aria-label*="Add"], button[aria-label*="Create"]'
        ) as HTMLButtonElement | null;
        createBtn?.click();
      }, 300);
    });
  }
};

const breadcrumbs = computed(() => {
  const segments = route.path.split("/").filter(Boolean);
  const items: { label: string; to?: string }[] = [
    { label: "Platform Admin", to: { name: "super-admin-overview" } },
  ];
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ label, to: path });
  }
  return items;
});

const pageTitle = computed(() => {
  const explicit = (route.meta?.title as string | undefined)?.trim();
  if (explicit) return explicit;
  const name = route.name as string | undefined;
  if (!name) return "Platform Admin";
  const special: Record<string, string> = {
    "super-admin-overview": "Overview",
    "tenant-dashboard": "Tenants",
    "tenant-detail": "Tenant Detail",
    "tenant-migrations": "Migrations",
    "tenant-provisioning": "Provisioning",
    "tenant-api-keys": "API Keys",
    "tenant-branding": "Branding",
    "tenant-grace-period": "Grace Period",
    "tenant-timeline": "Status Timeline",
    "tenant-notes": "Notes",
    "tenant-trial": "Trial Management",
    "tenant-invoices": "Invoices",
    "tenant-onboarding": "Onboarding",
    "tenant-dsar": "DSAR Requests",
    "plans-management": "Plans",
    "platform-payment-dashboard": "Payments",
    "platform-usage": "Usage",
    "platform-revenue": "Revenue",
    "platform-geographic": "Geographic",
    "platform-bulk-actions": "Bulk Actions",
    "platform-analytics": "Advanced Analytics",
    "platform-vertical-analytics": "Vertical Analytics",
    "platform-settings": "Settings",
    "platform-audit": "Audit Log",
    "platform-reports": "Reports",
    "platform-roles": "Platform Users",
    "super-admin-login": "Login",
  };
  return (
    special[name] ||
    name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
});

watch(
  () => [pageTitle.value, route.path] as const,
  ([title]) => {
    if (typeof document !== "undefined") {
      document.title = title
        ? `${title} | Vibespot Business`
        : "Vibespot Business";
    }
  },
  { immediate: true }
);

const currentSection = computed(() => {
  const currentRoute = route.name as string;
  for (const item of visibleTopBarItems.value) {
    if (item.routeName === currentRoute) {
      return item.section || null;
    }
  }
  return null;
});

const itemCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const item of visibleTopBarItems.value) {
    const section = item.section || "Other";
    counts[section] = (counts[section] || 0) + 1;
  }
  return counts;
});

const topBarNavRef = ref<HTMLElement | null>(null);

const closeTopBarDropdown = (e: MouseEvent) => {
  if (activeDropdown.value && !topBarNavRef.value?.contains(e.target as Node)) {
    activeDropdown.value = null;
  }
};

onMounted(() => {
  document.addEventListener("click", closeTopBarDropdown);
  document.addEventListener("keydown", onTopBarKeydown);
  document.addEventListener("keydown", onGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", closeTopBarDropdown);
  document.removeEventListener("keydown", onTopBarKeydown);
  document.removeEventListener("keydown", onGlobalKeydown);
});

const groupedNavItems = computed(() => {
  const groups: Record<string, NavItem[]> = {};
  for (const item of visibleNavItems.value) {
    const section = item.section || "Other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
});

const SECTION_ORDER = [
  "Dashboard",
  "Tenants",
  "Financial",
  "Support",
  "Integrations",
  "Security & Compliance",
  "Platform",
  "Data & Tools",
];

const orderedSections = computed(() => {
  const sections = Object.keys(groupedNavItems.value);
  return sections.sort((a, b) => {
    const aIdx = SECTION_ORDER.indexOf(a);
    const bIdx = SECTION_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
});

const logout = async () => {
  if (!isAuthenticated.value) return;
  await authStore.logout();
  router.push({ name: "home" });
};

const isActive = (routeName: string) =>
  route.name === routeName ||
  (typeof route.name === "string" && route.name.startsWith(`${routeName}-`));

watch(
  () => route.name,
  (newRoute) => {
    const section = visibleTopBarItems.value.find(
      (item) => item.routeName === (newRoute as string)
    )?.section;
    if (section && !activeDropdown.value) {
      activeDropdown.value = section;
    }
  },
  { immediate: true }
);

watch(
  () => authStore.currentTenant?.businessVertical,
  (vertical) => {
    if (typeof document !== "undefined") {
      const allowed = ["restaurant", "salon", "event"];
      const safe = allowed.includes(vertical || "") ? vertical || "" : "";
      document.documentElement.setAttribute("data-vertical", safe);
    }
  },
  { immediate: true }
);
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="sa-layout">
    <aside
      class="sa-sidebar"
      :class="[
        { minimized: collapsed },
        { 'sidebar-mobile-visible': sidebarVisible && windowWidth <= 768 },
      ]"
    >
      <div class="sa-sidebar-inner">
        <div class="sa-sidebar-top">
          <div class="sa-sidebar-header">
            <Icon icon="mdi:shield-crown" width="28" height="28" />
            <span v-if="!collapsed" class="sa-brand">Platform Admin</span>
          </div>
          <button
            v-if="!collapsed"
            class="sa-collapse-btn"
            @click="collapsed = true"
            aria-label="Collapse sidebar"
          >
            <Icon icon="mdi:chevron-left" width="20" height="20" />
          </button>
          <button
            v-else
            class="sa-expand-btn"
            @click="collapsed = false"
            aria-label="Expand sidebar"
          >
            <Icon icon="mdi:chevron-right" width="20" height="20" />
          </button>

          <nav class="sa-nav">
            <template v-for="section in orderedSections" :key="section">
              <div class="sa-nav-section">{{ section }}</div>
              <VaSidebarItem
                v-for="item in groupedNavItems[section]"
                :key="item.routeName"
                :to="{ name: item.routeName }"
                :aria-label="item.text"
                :class="[
                  'sa-nav-item',
                  { 'sa-nav-item-active': isActive(item.routeName) },
                ]"
              >
                <template #icon>
                  <Icon :icon="item.icon" width="20" height="20" />
                </template>
                <span v-if="!collapsed" class="sa-nav-text">{{
                  item.text
                }}</span>
              </VaSidebarItem>
            </template>
          </nav>
        </div>

        <div class="sa-sidebar-bottom">
          <div class="sa-user-section" v-if="user">
            <div class="sa-user-avatar">
              {{ user.username?.charAt(0)?.toUpperCase() }}
            </div>
            <div v-if="!collapsed" class="sa-user-info">
              <span class="sa-user-name">{{ user.username }}</span>
              <span class="sa-user-role">Super Admin</span>
            </div>
          </div>
          <button type="button" class="sa-logout-item" @click="logout">
            <Icon icon="mdi:logout" width="20" height="20" />
            <span v-if="!collapsed" class="sa-nav-text">Logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div
      id="main-content"
      class="sa-main"
      :style="{
        marginLeft: sidebarVisible ? (collapsed ? '72px' : '260px') : '0px',
      }"
    >
      <header class="sa-topbar">
        <div class="sa-topbar-left">
          <button
            class="sa-toggle-btn"
            @click="toggleSidebar"
            :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
          >
            <Icon
              :icon="collapsed ? 'mdi-menu-right' : 'mdi-menu-left'"
              width="20"
              height="20"
            />
          </button>

          <nav
            v-if="orderedTopBarSections.length"
            class="sa-topbar-nav"
            ref="topBarNavRef"
          >
            <div class="sa-topbar-nav-scroll">
              <template v-for="section in orderedTopBarSections" :key="section">
                <div
                  class="sa-dropdown"
                  :class="{ open: activeDropdown === section }"
                >
                  <button
                    type="button"
                    class="sa-dropdown-btn"
                    :id="dropdownBtnId(section)"
                    :class="{ active: currentSection === section }"
                    @click="toggleDropdown(section)"
                    @keydown="onDropdownBtnKeydown($event, section)"
                    :aria-expanded="activeDropdown === section"
                    :aria-controls="dropdownPanelId(section)"
                    :aria-haspopup="true"
                  >
                    {{ section }}
                    <span v-if="itemCounts[section]" class="sa-dropdown-count">
                      {{ itemCounts[section] }}
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      width="16"
                      height="16"
                      class="sa-dropdown-icon"
                    />
                  </button>
                  <div
                    class="sa-dropdown-panel"
                    :id="dropdownPanelId(section)"
                    :aria-labelledby="dropdownBtnId(section)"
                    @keydown="onDropdownPanelKeydown($event, section)"
                  >
                    <VaSidebarItem
                      v-for="item in topBarGroups[section]"
                      :key="item.routeName"
                      :to="{ name: item.routeName }"
                      :aria-label="item.text"
                      class="sa-dropdown-item"
                      :class="{
                        'sa-dropdown-item-active': isActive(item.routeName),
                      }"
                      @click="activeDropdown = null"
                    >
                      <template #icon>
                        <Icon :icon="item.icon" width="18" height="18" />
                      </template>
                      <span class="sa-dropdown-text">{{ item.text }}</span>
                    </VaSidebarItem>
                  </div>
                </div>
              </template>
            </div>
          </nav>
        </div>
        <div class="sa-topbar-center">
          <span class="sa-topbar-title">{{ pageTitle }}</span>
        </div>
        <div class="sa-topbar-right">
          <div v-if="user" class="sa-user-chip">
            {{ user.username?.charAt(0)?.toUpperCase() }}
          </div>
        </div>
      </header>

      <nav
        v-if="breadcrumbs.length > 1"
        class="sa-breadcrumbs"
        aria-label="Breadcrumb"
      >
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <RouterLink
            v-if="crumb.to"
            :to="crumb.to"
            class="sa-breadcrumb-link"
            :class="{
              'sa-breadcrumb-link--active': index === breadcrumbs.length - 1,
            }"
          >
            {{ crumb.label }}
          </RouterLink>
          <span v-else class="sa-breadcrumb-current">{{ crumb.label }}</span>
          <span
            v-if="index < breadcrumbs.length - 1"
            class="sa-breadcrumb-separator"
            aria-hidden="true"
            >/</span
          >
        </template>
      </nav>

      <main class="sa-content">
        <OfflineBanner />
        <Transition
          name="page-transition"
          @before-enter="beforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <RouterView v-slot="{ Component }">
            <component v-if="Component" :is="Component" :key="$route.name" />
          </RouterView>
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.sa-layout {
  display: flex;
  min-height: 100vh;
  background: var(--background);
}

.sa-sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--brand-900);
  color: var(--white);
  display: flex;
  flex-direction: column;
  position: fixed;
  inset-block: 0;
  left: 0;
  z-index: var(--z-sidebar);
  transition: width var(--duration-normal) var(--ease-in-out);
}

.sa-sidebar.minimized {
  width: 72px;
}

.sa-sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sa-sidebar-top {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 12px;
}

.sa-sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 18px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.01em;
  position: relative;
}

.sa-brand {
  white-space: nowrap;
}

.sa-collapse-btn,
.sa-expand-btn {
  position: absolute;
  top: 18px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--white) 12%, transparent);
  background: color-mix(in srgb, var(--white) 8%, transparent);
  color: var(--white);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.sa-collapse-btn:hover,
.sa-expand-btn:hover {
  background: color-mix(in srgb, var(--white) 16%, transparent);
}

.sa-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sa-nav-section {
  padding: 12px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--white) 45%, transparent);
  user-select: none;
}

.sa-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--white) !important;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.sa-nav-item:hover {
  background: color-mix(in srgb, var(--white) 8%, transparent);
  color: var(--white) !important;
}

.sa-nav-item-active {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: var(--white) !important;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-600) 25%, transparent);
}

.sa-nav-text {
  white-space: nowrap;
  color: var(--white) !important;
}

.sa-sidebar-bottom {
  padding: 12px;
  border-top: 1px solid color-mix(in srgb, var(--white) 8%, transparent);
}

.sa-user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 12px;
}

.sa-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  color: var(--brand-900);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.sa-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sa-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sa-user-role {
  font-size: 11px;
  color: color-mix(in srgb, var(--white) 55%, transparent);
}

.sa-logout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: color-mix(in srgb, var(--white) 60%, transparent);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
}

.sa-logout-item:hover {
  background: color-mix(in srgb, var(--white) 8%, transparent);
  color: var(--white);
}

.sa-main {
  flex: 1;
  min-height: 100vh;
  transition: margin var(--duration-normal) var(--ease-in-out);
  display: flex;
  flex-direction: column;
}

.sa-topbar {
  display: flex;
  align-items: center;
  height: var(--topbar-height);
  background: var(--background);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-6);
  gap: var(--space-4);
  z-index: var(--z-sticky);
  position: sticky;
  top: 0;
}

@supports (backdrop-filter: blur(1px)) {
  .sa-topbar {
    background: color-mix(in srgb, var(--background) 90%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

.sa-topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  overflow: visible;
  max-width: 60%;
}

.sa-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.sa-toggle-btn:hover {
  background: var(--neutral-100);
  border-color: var(--border);
  color: var(--ink-secondary);
}

.sa-topbar-nav {
  display: flex;
  align-items: center;
  height: 36px;
  overflow: visible;
}

.sa-topbar-nav-scroll {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);
  width: 100%;
  overflow: visible;
}

.sa-dropdown {
  position: relative;
}

.sa-dropdown-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px 14px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
}

.sa-dropdown-btn:hover {
  background: var(--neutral-100);
  border-color: var(--border);
  color: var(--ink);
}

.sa-dropdown-btn.active {
  background: var(--accent-soft);
  border-color: var(--accent-500);
  color: var(--accent-text);
}

.sa-dropdown-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  border-radius: var(--radius-full);
  background: var(--neutral-200);
  color: var(--neutral-700);
}

.sa-dropdown-btn.active .sa-dropdown-count {
  background: var(--accent-100);
  color: var(--accent-600);
}

.sa-dropdown-icon {
  transition: transform var(--duration-fast) var(--ease-out);
  color: var(--ink-subtle);
}

.sa-dropdown.open .sa-dropdown-icon,
.sa-dropdown:hover .sa-dropdown-icon {
  transform: rotate(180deg);
  color: var(--ink);
}

.sa-dropdown-panel {
  display: none;
  position: absolute;
  top: 115%;
  left: 0;
  min-width: 240px;
  max-height: 600px;
  overflow: visible;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
  padding: 4px 0;
}

.sa-dropdown.open .sa-dropdown-panel,
.sa-dropdown:hover .sa-dropdown-panel {
  display: block;
}

.sa-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  border-radius: 0;
  color: var(--ink) !important;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.sa-dropdown-item:hover {
  background: var(--neutral-100);
  color: var(--ink) !important;
}

.sa-dropdown-item-active {
  background: var(--accent-100) !important;
  color: var(--accent-600) !important;
  font-weight: 600;
}

.sa-dropdown-text {
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .sa-topbar-nav {
    display: none;
  }
}

.sa-topbar-center {
  flex: 1;
  text-align: center;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 var(--space-2);
}

.sa-topbar-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}

.sa-topbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-3);
}

.sa-user-chip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  color: var(--brand-900);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.sa-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  min-height: calc(100vh - var(--topbar-height));
  position: relative;
  z-index: 1;
}

.sa-breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--surface);
  border-bottom: 1px solid var(--border-subtle);
}

.sa-breadcrumb-link {
  color: var(--ink-muted);
  text-decoration: none;
  transition: color var(--duration-150) var(--ease-in-out);
}

.sa-breadcrumb-link:hover {
  color: var(--accent);
}

.sa-breadcrumb-link--active {
  color: var(--ink);
  font-weight: 600;
  pointer-events: none;
}

.sa-breadcrumb-current {
  color: var(--ink);
  font-weight: 600;
}

.sa-breadcrumb-separator {
  color: var(--neutral-400);
  user-select: none;
}

@media screen and (max-width: 768px) {
  .sa-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    z-index: var(--z-modal) !important;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  .sa-sidebar.sidebar-mobile-visible {
    transform: translateX(0);
  }

  .sa-content {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
