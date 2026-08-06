import { ref, onMounted, onUnmounted } from "vue";

export type ConnectionStatus = "online" | "offline" | "syncing" | "sync-failed";

export const useOnlineStatus = () => {
  const status = ref<ConnectionStatus>("online");
  const pendingCount = ref(0);
  const syncError = ref<string | null>(null);

  const setStatus = (newStatus: ConnectionStatus) => {
    status.value = newStatus;
  };

  const setPendingCount = (count: number) => {
    pendingCount.value = count;
  };

  const setSyncError = (error: string | null) => {
    syncError.value = error;
  };

  const handleOnline = () => {
    setStatus("syncing");
    setSyncError(null);
  };

  const handleOffline = () => {
    setStatus("offline");
  };

  onMounted(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
  });

  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
  });

  return {
    status,
    pendingCount,
    syncError,
    setStatus,
    setPendingCount,
    setSyncError,
    isOnline: () => status.value === "online",
  };
};
