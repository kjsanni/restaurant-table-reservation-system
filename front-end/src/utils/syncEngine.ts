import { offlineDB } from "./offlineDB";

export type MutationType = "create" | "update" | "delete";

export interface PendingMutation {
  id?: number;
  entityType: string;
  entityId: string | number;
  mutationType: MutationType;
  payload: any;
  createdAt?: string;
}

export interface SyncResult {
  applied: number;
  failed: number;
  conflicts: Array<{
    entityType: string;
    entityId: string | number;
    reason: string;
  }>;
}

const ENTITY_SYNC_KEYS: Record<string, string> = {
  appointments: "appointments_synced_at",
  clients: "clients_synced_at",
  services: "services_synced_at",
  staffShifts: "staff_shifts_synced_at",
};

export const syncEngine = {
  async getSyncedAt(entityType: string): Promise<Date | null> {
    const value = await offlineDB.getMeta(
      ENTITY_SYNC_KEYS[entityType] || entityType
    );
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  },

  async setSyncedAt(entityType: string, date: Date): Promise<void> {
    const key = ENTITY_SYNC_KEYS[entityType] || entityType;
    await offlineDB.setMeta(key, date.toISOString());
  },

  async enqueueMutation(
    mutation: Omit<PendingMutation, "id" | "createdAt">
  ): Promise<void> {
    await offlineDB.put("pendingMutations", {
      ...mutation,
      createdAt: new Date().toISOString(),
    });
  },

  async getPendingMutations(): Promise<PendingMutation[]> {
    return offlineDB.getAll("pendingMutations");
  },

  async clearPendingMutation(id: number): Promise<void> {
    await offlineDB.delete("pendingMutations", id);
  },

  async clearAllPendingMutations(): Promise<void> {
    await offlineDB.clear("pendingMutations");
  },

  async replayMutations(
    apply: (
      mutation: PendingMutation
    ) => Promise<{ success: boolean; conflict?: boolean; reason?: string }>
  ): Promise<SyncResult> {
    const mutations = await this.getPendingMutations();
    const result: SyncResult = { applied: 0, failed: 0, conflicts: [] };

    for (const mutation of mutations) {
      try {
        const outcome = await apply(mutation);
        if (outcome.success) {
          await this.clearPendingMutation(mutation.id!);
          result.applied++;
        } else if (outcome.conflict) {
          result.conflicts.push({
            entityType: mutation.entityType,
            entityId: mutation.entityId,
            reason: outcome.reason || "Server state differs",
          });
          await this.clearPendingMutation(mutation.id!);
          result.failed++;
        } else {
          result.failed++;
        }
      } catch (err) {
        result.failed++;
      }
    }

    return result;
  },
};
