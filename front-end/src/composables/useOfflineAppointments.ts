import { ref, computed } from "vue";
import { useOnlineStatus } from "@/composables/useOnlineStatus";
import { offlineDB } from "@/utils/offlineDB";
import { syncEngine, type PendingMutation } from "@/utils/syncEngine";
import appointmentAPI from "@/services/appointmentAPI";

export interface DraftAppointment {
  id: string;
  start: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  serviceId: number;
  stationId?: number;
  stylistId?: number;
  locationId?: number;
  notes?: string;
  source: string;
  customerName?: string;
  serviceName?: string;
  isDraft: boolean;
}

const drafts = ref<DraftAppointment[]>([]);

export const useOfflineAppointments = () => {
  const { status, setStatus, setPendingCount } = useOnlineStatus();

  const isOnline = computed(() => status.value === "online");

  const loadDrafts = async () => {
    const all = await offlineDB.getAll("appointments");
    drafts.value = all.filter((a: any) => a.isDraft);
    setPendingCount(drafts.value.length);
  };

  const saveDraft = async (appointment: DraftAppointment) => {
    await offlineDB.put("appointments", appointment);
    drafts.value.push(appointment);
    setPendingCount(drafts.value.length);
  };

  const createAppointment = async (payload: any) => {
    if (isOnline.value) {
      await appointmentAPI.createAppointment(payload);
      return;
    }

    const draft: DraftAppointment = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...payload,
      isDraft: true,
    };

    await saveDraft(draft);

    await syncEngine.enqueueMutation({
      entityType: "appointments",
      entityId: draft.id,
      mutationType: "create",
      payload: draft,
    });
  };

  const replayDrafts = async () => {
    if (!isOnline.value) return;

    setStatus("syncing");
    const pending = await syncEngine.getPendingMutations();

    for (const mutation of pending) {
      if (mutation.entityType !== "appointments") continue;

      try {
        if (mutation.mutationType === "create") {
          const draft = mutation.payload as DraftAppointment;
          const cleanPayload = { ...draft };
          delete cleanPayload.id;
          delete cleanPayload.isDraft;

          await appointmentAPI.createAppointment(cleanPayload);
          await offlineDB.delete("appointments", draft.id);
          await syncEngine.clearPendingMutation(mutation.id!);
        }
      } catch (err) {
        setStatus("sync-failed");
        return;
      }
    }

    await loadDrafts();
    setStatus("online");
  };

  return {
    drafts,
    isOnline,
    loadDrafts,
    createAppointment,
    replayDrafts,
  };
};
