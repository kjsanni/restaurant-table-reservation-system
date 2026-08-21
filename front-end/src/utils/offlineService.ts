import { offlineDB } from "./offlineDB";
import { syncEngine, type PendingMutation } from "./syncEngine";

export type OnlineStatus = "online" | "offline" | "syncing" | "sync-failed";

const ONLINE_EVENT = "online";
const OFFLINE_EVENT = "offline";

export const offlineService = {
  async isOnline(): Promise<boolean> {
    if (typeof window === "undefined") return true;
    if (!navigator.onLine) return false;

    try {
      const response = await fetch("/api/v1/health", {
        method: "GET",
        cache: "no-store",
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async queueMutation(
    mutation: Omit<PendingMutation, "id" | "createdAt">
  ): Promise<void> {
    await syncEngine.enqueueMutation(mutation);
  },

  async getCached<T>(
    storeName: string,
    id: string | number
  ): Promise<T | undefined> {
    return offlineDB.get(storeName, id);
  },

  async setCached<T>(storeName: string, item: T): Promise<void> {
    await offlineDB.put(storeName, item);
  },

  async getCachedAll<T>(storeName: string): Promise<T[]> {
    return offlineDB.getAll(storeName);
  },

  async clearCache(storeName?: string): Promise<void> {
    if (storeName) {
      await offlineDB.clear(storeName);
    } else {
      await offlineDB.clear("appointments");
      await offlineDB.clear("clients");
      await offlineDB.clear("services");
      await offlineDB.clear("staffShifts");
    }
  },

  async replayMutations(
    apply: (
      mutation: PendingMutation
    ) => Promise<{ success: boolean; conflict?: boolean; reason?: string }>
  ): Promise<{
    applied: number;
    failed: number;
    conflicts: Array<{
      entityType: string;
      entityId: string | number;
      reason: string;
    }>;
  }> {
    return syncEngine.replayMutations(apply);
  },

  async getPendingMutations(): Promise<PendingMutation[]> {
    return syncEngine.getPendingMutations();
  },

  async clearPendingMutations(): Promise<void> {
    return syncEngine.clearAllPendingMutations();
  },

  async clearPendingMutation(id: number): Promise<void> {
    await syncEngine.clearPendingMutation(id);
  },
};
