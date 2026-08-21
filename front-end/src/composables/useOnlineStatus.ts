import { ref, onMounted, onUnmounted } from "vue";
import { offlineService } from "@/utils/offlineService";

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

  const updatePendingCount = async () => {
    const mutations = await offlineService.getPendingMutations();
    pendingCount.value = mutations.length;
  };

  const handleOnline = async () => {
    setStatus("syncing");
    setSyncError(null);
    await updatePendingCount();

    try {
      const result = await offlineService.replayMutations(async () => {
        return { success: true };
      });
      if (result.failed > 0) {
        setStatus("sync-failed");
        setSyncError(`${result.failed} changes failed to sync`);
      } else {
        setStatus("online");
        pendingCount.value = 0;
      }
    } catch (err) {
      setStatus("sync-failed");
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    }
  };

  const handleOffline = () => {
    setStatus("offline");
  };

  onMounted(async () => {
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      await updatePendingCount();
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
    updatePendingCount,
    isOnline: () => status.value === "online",
  };
};
