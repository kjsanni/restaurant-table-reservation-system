<script setup>
import ButtonAction from "@/components/ButtonAction.vue";
import CrossIcon from "~icons/radix-icons/cross-circled";
import NotFoundResource from "@/components/NotFoundResource.vue";
import PopupBox from "@/components/PopupBox.vue";
import reservationAPI from "@/services/reservationAPI";
import { useAuthStore } from "@/stores/auth";
import { computed, ref } from "vue";
import logger from "@/utils/logger";

const props = defineProps({
  fields: Object,
  collection: Array,
});

const emit = defineEmits([
  "onOpen",
  "onSelectedReservation",
  "onCanceledReservation",
]);

import { getPaymentStatusColor, getPaymentStatusLabel } from "@/constants";

const showNotes = (item) => {
  if (item.notes) {
    notesPopup.value = true;
    notesContent.value = item.notes;
  }
};

const notesPopup = ref(false);
const notesContent = ref("");

const authStore = useAuthStore();
const canManageTables = computed(
  () => authStore.user?.permissions?.manage_tables === true
);
const canEditReservations = computed(
  () => authStore.user?.permissions?.edit_reservations === true
);

const passItemData = (item) => {
  emit("onSelectedReservation", item);
};

const openPopup = (text) => {
  emit("onOpen", {
    isOpen: true,
    headerText: text,
  });
};

const getFieldValue = (item, fieldKey) => {
  const val = item[fieldKey];
  if (fieldKey === "resStatus" || fieldKey === "paymentStatus") {
    return val ? val.toUpperCase() : "";
  }
  return val || "";
};

const toUpperCase = (str) => {
  return str.toUpperCase();
};

const isResStatusMissed = (resStatus) => {
  return resStatus === "missed";
};

const showConfirm = ref(false);
const confirmTarget = ref(null);
const confirmMessage = ref("");
const confirmActionText = ref("Confirm");

const openConfirm = (item, message, actionText = "Confirm") => {
  confirmTarget.value = item;
  confirmMessage.value = message;
  confirmActionText.value = actionText;
  showConfirm.value = true;
};

const closeConfirm = () => {
  showConfirm.value = false;
  confirmTarget.value = null;
  confirmMessage.value = "";
};

const cancelReservation = async (item) => {
  if (confirmTarget.value?.id === item.id) {
    try {
      await reservationAPI.cancelReservation(item.id);
      logger.debug("Reservation cancelled", { id: item.id });
      emit("onCanceledReservation");
    } catch (err) {
      logger.error("Cancel reservation failed", { error: err.message });
    } finally {
      closeConfirm();
      return;
    }
  }
  openConfirm(item, "Cancel this reservation?", "Cancel Reservation");
};

const deleteReservation = async (item) => {
  if (confirmTarget.value?.id === item.id) {
    try {
      await reservationAPI.cancelReservation(item.id);
      emit("onCanceledReservation");
    } catch (err) {
      logger.error("Delete reservation failed", { error: err.message });
    } finally {
      closeConfirm();
      return;
    }
  }
  openConfirm(item, "Permanently delete this reservation?", "Delete");
};
</script>

<template>
  <div class="main-wrapper">
    <table key="1" v-if="props.collection.length !== 0">
      <thead>
        <tr class="header-row">
          <th v-for="field in props.fields" :key="field">
            {{ field }}
          </th>
          <th>Payment</th>
          <th>Loyalty</th>
          <th>Notes</th>
          <th>#</th>
        </tr>
      </thead>
      <tbody>
        <tr class="body-row" v-for="item in props.collection" :key="item">
          <td v-for="fieldKey in Object.keys(props.fields)" :key="fieldKey">
            {{ getFieldValue(item, fieldKey) }}
          </td>
          <td>
            <span
              class="payment-badge"
              :style="{
                backgroundColor:
                  getPaymentStatusColor(item.paymentStatus) || '#9ca3af',
              }"
            >
              {{
                getPaymentStatusLabel(item.paymentStatus) || item.paymentStatus
              }}
            </span>
          </td>
          <td>
            <div class="loyalty-cell">
              <span v-if="item.visitCount" class="visit-count">
                {{ item.visitCount }} visits
              </span>
              <span v-if="item.lastVisitDate" class="last-visit">
                Last: {{ new Date(item.lastVisitDate).toLocaleDateString() }}
              </span>
              <div v-if="item.tags?.length" class="tag-chips">
                <span v-for="tag in item.tags" :key="tag" class="loyalty-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </td>
          <td>
            <button
              v-if="item.notes"
              class="notes-btn"
              @click="showNotes(item)"
              title="View notes"
            >
              📝
            </button>
          </td>
          <td>
            <div
              v-if="['pending', 'missed'].includes(item.resStatus)"
              class="actions"
            >
              <ButtonAction
                text="Seat"
                color="#22c55e"
                @click="
                  openPopup('Choose Table');
                  passItemData(item);
                "
              />
              <ButtonAction
                text="Edit"
                color="#3b82f6"
                @click="
                  openPopup('Edit Reservation');
                  passItemData(item);
                "
              />
              <ButtonAction
                v-if="canManageTables"
                text="Assign"
                color="#f59e0b"
                @click="
                  openPopup('Assign Staff');
                  passItemData(item);
                "
              />
              <ButtonAction
                text="Cancel"
                color="#ef4444"
                @click="cancelReservation(item)"
              />
            </div>
            <div class="actions" v-else-if="canEditReservations">
              <ButtonAction
                text="Delete"
                color="#ef4444"
                @click="deleteReservation(item)"
              />
            </div>
            <div class="status" v-else>
              <p
                :class="
                  isResStatusMissed(item.resStatus) ? 'redColor' : 'blueColor'
                "
              >
                {{ toUpperCase(item.resStatus) }}
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <NotFoundResource
      class="test"
      v-else
      text="No Reservations"
      position="relative"
    >
      <template #icon><CrossIcon class="vector" /></template>
    </NotFoundResource>
  </div>

  <PopupBox
    :is-open="showConfirm"
    header-text="Confirm"
    :is-closable="true"
    @close-modal="closeConfirm"
  >
    <template #popup-content>
      <div class="confirm-content">
        <p>{{ confirmMessage }}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="closeConfirm">Cancel</button>
          <button class="btn btn-danger" @click="confirmTarget && cancelReservation(confirmTarget)">{{ confirmActionText }}</button>
        </div>
      </div>
    </template>
  </PopupBox>

  <PopupBox
    :is-open="notesPopup"
    header-text="Reservation Notes"
    :is-closable="true"
    @close-modal="notesPopup = false"
  >
    <template #popup-content>
      <div class="notes-popup-content">
        <p>{{ notesContent }}</p>
      </div>
    </template>
  </PopupBox>
</template>

<style scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-content p {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background-color: var(--primary-red);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.notes-popup-content {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
