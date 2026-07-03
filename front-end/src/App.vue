<script setup>
import TheSidebar from "@/components/TheSidebar.vue";
import TheFooter from "@/components/TheFooter.vue";
import AppToast from "@/components/AppToast.vue";
import WaitlistOfferBanner from "@/components/WaitlistOfferBanner.vue";
import { onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  transports: ["websocket"],
});

window.__socket__ = socket;

onMounted(() => {
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});

onUnmounted(() => {
  socket.disconnect();
  delete window.__socket__;
});
</script>

<template>
  <div class="wrapper">
    <TheSidebar />
    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.name" />
        </Transition>
      </RouterView>
    </main>
    <TheFooter />
    <AppToast />
    <WaitlistOfferBanner @seated="socket.emit('waitlist-offer-accepted')" />
  </div>
</template>

<style scoped>
:deep(.va-layout) {
  overflow: visible;
  height: auto;
  min-height: 100vh;
}

:deep(.va-sidebar) {
  background: linear-gradient(
    180deg,
    var(--brand-900) 0%,
    #120e0b 100%
  ) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 4px 0 32px rgba(26, 20, 16, 0.25) !important;
}

:deep(.va-sidebar__menu) {
  background: transparent !important;
}

.app-sidebar {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-sidebar);
}

.content-wrapper {
  transition: margin-left var(--duration-normal) var(--ease-in-out);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-4);
  overflow-y: auto;
  overflow-x: hidden;
  gap: var(--space-2);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3) var(--space-5);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: var(--space-5);
  transition: opacity var(--duration-fast) var(--ease-in-out);
}
.sidebar-header:hover {
  opacity: 0.9;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
  background: white;
  padding: 2px;
  box-shadow: var(--shadow-sm);
}

.brand {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: white;
  white-space: nowrap;
  letter-spacing: var(--tracking-wide);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.35);
  padding: var(--space-3) var(--space-3) var(--space-2);
  font-weight: 600;
}

.nav-item {
  border-radius: var(--radius-md);
  margin: 0;
  padding: 0;
  height: 42px;
  transition: all var(--duration-fast) var(--ease-in-out);
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nav-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  opacity: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover {
  transform: translateX(4px);
}

.nav-item:deep(.va-sidebar-item__content) {
  padding: var(--space-3) var(--space-4);
  color: rgba(255, 255, 255, 0.8) !important;
}
.nav-item:deep(.va-sidebar-item__content):hover {
  color: white !important;
}
.nav-item:deep(.va-sidebar-item--active .va-sidebar-item__content) {
  color: white !important;
  background: linear-gradient(
    90deg,
    rgba(217, 119, 6, 0.18) 0%,
    rgba(180, 83, 9, 0.08) 100%
  ) !important;
  border-radius: var(--radius-lg);
  box-shadow: inset 3px 0 0 var(--accent) !important;
}
.nav-item:deep(.va-sidebar-item--active::before) {
  opacity: 1;
}

.nav-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-normal);
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.nav-item:hover .nav-text,
.nav-item:deep(.va-sidebar-item--active .nav-text) {
  color: white;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.45);
  text-transform: capitalize;
}

.logout-item {
  color: rgba(255, 255, 255, 0.55);
}
.logout-item:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  color: #fca5a5 !important;
}

.app-topbar-integrated {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-6);
  gap: var(--space-4);
  z-index: var(--z-sticky);
  position: sticky;
  top: 0;
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.topbar-left :deep(.va-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
}
.topbar-left :deep(.va-button__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;
}

.topbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.topbar-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  min-height: calc(100vh - 64px);
  transition: margin-left var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 20, 16, 0.45);
  z-index: var(--z-overlay);
  transition: opacity var(--duration-300) var(--ease-out);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

@media screen and (max-width: 768px) {
  .app-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    z-index: var(--z-modal) !important;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  .app-sidebar.sidebar-mobile-visible {
    transform: translateX(0);
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }

  .nav-label {
    display: none;
  }

  .sidebar-header {
    border-bottom: none;
    padding-bottom: var(--space-3);
  }

  .sidebar-top {
    padding: var(--space-4) var(--space-3);
  }

  .nav-item {
    height: 40px;
  }
}

.app-footer {
  padding: var(--space-5) var(--space-6);
  text-align: center;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface);
  margin-left: 0;
  transition: margin-left var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.footer-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 450;
}
</style>
