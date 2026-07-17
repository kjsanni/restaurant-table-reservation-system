import { ref, computed } from "vue";
import { getApiErrorMessage } from "@/utils/apiError";

export function useReservationActions({
  loadSchedule,
  reservationAPI,
  tableAPI,
  groupAPI,
  loadFreeTables,
  loadWaitingStaff,
}) {
  const activeAction = ref(null);
  const actionReservation = ref(null);
  const actionLoading = ref(false);
  const actionError = ref("");
  const newResDate = ref("");
  const newResTime = ref("");

  const actionTitle = computed(() => {
    const titles = {
      cancel: "Cancel Reservation",
      payment: "Update Payment",
      table: "Assign Table",
      staff: "Assign Staff",
      reschedule: "Reschedule",
      new: "New Reservation",
    };
    return titles[activeAction.value] || "";
  });

  const openAction = (action, res) => {
    activeAction.value = action;
    actionReservation.value = res;
    actionError.value = "";
    if (action === "payment") {
      // no extra init needed
    } else if (action === "table") {
      loadFreeTables?.();
    } else if (action === "staff") {
      loadWaitingStaff?.();
    } else if (action === "reschedule") {
      newResDate.value = res.resDate || "";
      newResTime.value = res.resTime || "";
    }
  };

  const closeAction = () => {
    activeAction.value = null;
    actionReservation.value = null;
    actionError.value = "";
    newResDate.value = "";
    newResTime.value = "";
  };

  const handleCancel = async () => {
    if (!actionReservation.value) return;
    actionLoading.value = true;
    actionError.value = "";
    try {
      await reservationAPI.cancelReservation(actionReservation.value.id);
      await loadSchedule();
      closeAction();
    } catch (err) {
      actionError.value = getApiErrorMessage(
        err,
        "Failed to cancel reservation"
      );
    } finally {
      actionLoading.value = false;
    }
  };

  const handlePaymentChange = async (status) => {
    if (!actionReservation.value) return;
    actionLoading.value = true;
    actionError.value = "";
    try {
      await reservationAPI.editReservation(actionReservation.value.id, {
        paymentStatus: status,
      });
      await loadSchedule();
      closeAction();
    } catch (err) {
      actionError.value = getApiErrorMessage(err, "Failed to update payment");
    } finally {
      actionLoading.value = false;
    }
  };

  const handleAssignTable = async (tableId) => {
    if (!actionReservation.value || !tableId) return;
    actionLoading.value = true;
    actionError.value = "";
    try {
      await reservationAPI.chooseTable(actionReservation.value.id, tableId);
      await loadSchedule();
      closeAction();
    } catch (err) {
      actionError.value = getApiErrorMessage(err, "Failed to assign table");
    } finally {
      actionLoading.value = false;
    }
  };

  const handleAssignStaff = async (userId) => {
    if (!actionReservation.value || !userId) return;
    actionLoading.value = true;
    actionError.value = "";
    try {
      await reservationAPI.assignStaff(actionReservation.value.id, userId);
      await loadSchedule();
      closeAction();
    } catch (err) {
      actionError.value = getApiErrorMessage(err, "Failed to assign staff");
    } finally {
      actionLoading.value = false;
    }
  };

  const handleReschedule = async () => {
    if (!actionReservation.value) return;
    if (!newResDate.value || !newResTime.value) {
      actionError.value = "Please provide both date and time";
      return;
    }
    actionLoading.value = true;
    actionError.value = "";
    try {
      await reservationAPI.editReservation(actionReservation.value.id, {
        resDate: newResDate.value,
        resTime: newResTime.value,
      });
      await loadSchedule();
      closeAction();
    } catch (err) {
      actionError.value = getApiErrorMessage(err, "Failed to reschedule");
    } finally {
      actionLoading.value = false;
    }
  };

  return {
    activeAction,
    actionReservation,
    actionLoading,
    actionError,
    newResDate,
    newResTime,
    actionTitle,
    openAction,
    closeAction,
    handleCancel,
    handlePaymentChange,
    handleAssignTable,
    handleAssignStaff,
    handleReschedule,
  };
}
