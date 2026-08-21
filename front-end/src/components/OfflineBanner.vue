<script setup lang="ts">
import { useI18n } from "@/composables/useI18n";
import { useOnlineStatus } from "@/composables/useOnlineStatus";

const { t } = useI18n();
const { status, pendingCount, setStatus, setSyncError } = useOnlineStatus();
</script>

<template>
  <div v-if="status === 'offline'" class="offline-banner offline">
    <span class="offline-icon">&#x26A0;</span>
    <span class="offline-text">
      {{
        t(
          "common.offlineBanner",
          "Offline — changes will sync when you reconnect"
        )
      }}
    </span>
    <span v-if="pendingCount > 0" class="offline-pending">
      {{ t("common.pendingCount", "{count} pending", { count: pendingCount }) }}
    </span>
  </div>

  <div v-else-if="status === 'syncing'" class="offline-banner syncing">
    <span class="offline-spinner"></span>
    <span class="offline-text">
      {{ t("common.syncingBanner", "Syncing...") }}
    </span>
  </div>

  <div v-else-if="status === 'sync-failed'" class="offline-banner sync-failed">
    <span class="offline-icon">&#x2716;</span>
    <span class="offline-text">
      {{ t("common.syncFailedBanner", "Sync failed") }}
    </span>
    <button
      class="offline-retry"
      @click="
        setStatus('syncing');
        setSyncError(null);
      "
    >
      {{ t("common.retry", "Retry") }}
    </button>
  </div>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: white;
}
.offline {
  background: #b45309;
}
.syncing {
  background: #2563eb;
}
.sync-failed {
  background: #dc2626;
}
.offline-icon {
  font-size: 18px;
}
.offline-text {
  flex: 1;
  text-align: center;
}
.offline-pending {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.offline-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.offline-retry {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
