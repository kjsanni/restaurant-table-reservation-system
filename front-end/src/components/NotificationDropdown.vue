<template>
  <div class="notification-dropdown" ref="dropdownRef">
    <button
      class="notification-trigger"
      @click="toggle"
      aria-haspopup="true"
      :aria-expanded="open"
    >
      <Icon icon="mdi:bell-outline" width="22" height="22" />
      <span v-if="unreadCount" class="notification-badge">{{
        unreadCount
      }}</span>
    </button>

    <div v-if="open" class="notification-panel">
      <div class="notification-header">
        <span class="notification-title">Notifications</span>
        <button
          class="notification-mark-all"
          @click="markAllRead"
          v-if="unreadCount"
        >
          Mark all read
        </button>
      </div>

      <div v-if="loading" class="notification-state">Loading...</div>
      <div v-else-if="!items.length" class="notification-state">
        No notifications yet.
      </div>
      <div v-else class="notification-list">
        <button
          v-for="item in items"
          :key="item.id"
          class="notification-item"
          :class="{ 'notification-item-unread': !item.readAt }"
          @click="handleClick(item)"
        >
          <div class="notification-item-title">{{ item.title }}</div>
          <div v-if="item.message" class="notification-item-message">
            {{ item.message }}
          </div>
          <div class="notification-item-meta">
            <span>{{ formatTime(item.createdAt) }}</span>
            <span class="notification-item-type">{{ item.type }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import notificationAPI from "@/services/notificationAPI";

const open = ref(false);
const loading = ref(false);
const items = ref([]);

const unreadCount = computed(
  () => items.value.filter((item) => !item.readAt).length
);

const load = async () => {
  loading.value = true;
  try {
    const res = await notificationAPI.listNotifications();
    items.value = res.data?.collection || res.data?.items || [];
  } finally {
    loading.value = false;
  }
};

const toggle = () => {
  open.value = !open.value;
  if (open.value) {
    load();
  }
};

const markAllRead = async () => {
  const unread = items.value.filter((item) => !item.readAt);
  await Promise.all(unread.map((item) => notificationAPI.markRead(item.id)));
  await load();
};

const handleClick = async (item) => {
  if (!item.readAt) {
    await notificationAPI.markRead(item.id);
    await load();
  }
  open.value = false;
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const close = (event) => {
  const dropdown = document.querySelector(".notification-dropdown");
  if (dropdown && !dropdown.contains(event.target)) {
    open.value = false;
  }
};

onMounted(() => {
  load();
  document.addEventListener("click", close);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", close);
});
</script>

<style scoped>
.notification-dropdown {
  position: relative;
}
.notification-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.notification-trigger:hover {
  background: rgba(0, 0, 0, 0.06);
}
.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
.notification-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-width: calc(100vw - 32px);
  max-height: 480px;
  overflow: auto;
  border-radius: 12px;
  background: #fff;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 50;
}
.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.notification-title {
  font-weight: 700;
  font-size: 14px;
}
.notification-mark-all {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
}
.notification-state {
  padding: 18px 14px;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}
.notification-list {
  display: flex;
  flex-direction: column;
}
.notification-item {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
}
.notification-item:hover {
  background: #f8fafc;
}
.notification-item-unread {
  background: #eff6ff;
}
.notification-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.notification-item-message {
  margin-top: 4px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
}
.notification-item-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}
.notification-item-type {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
