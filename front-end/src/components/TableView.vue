<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import reservationAPI from "@/services/reservationAPI";
import { getPaymentStatusColor, getPaymentStatusLabel } from "@/constants";

const props = defineProps({
  fields: Object,
  collection: Array,
});

const emit = defineEmits([
  "onOpen",
  "onSelectedReservation",
  "onCanceledReservation",
]);

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
      emit("onCanceledReservation");
    } catch {
      // Cancellation failed
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
    } catch {
      // Deletion failed
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
    <table v-if="props.collection.length !== 0">
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
            <VaButton
              v-if="item.notes"
              icon="description"
              preset="secondary"
              @click="showNotes(item)"
              title="View notes"
            />
          </td>
          <td>
            <div
              v-if="['pending', 'missed'].includes(item.resStatus)"
              class="actions"
            >
              <VaButton
                text="Seat"
                color="success"
                @click="
                  openPopup('Choose Table');
                  passItemData(item);
                "
              />
              <VaButton
                text="Edit"
                color="primary"
                @click="
                  openPopup('Edit Reservation');
                  passItemData(item);
                "
              />
              <VaButton
                v-if="canManageTables"
                text="Assign"
                color="warning"
                @click="
                  openPopup('Assign Staff');
                  passItemData(item);
                "
              />
              <VaButton
                text="Cancel"
                color="danger"
                @click="cancelReservation(item)"
              />
            </div>
            <div class="actions" v-else-if="canEditReservations">
              <VaButton
                text="Delete"
                color="danger"
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
    <VaAlert v-else type="warning" class="test">No Reservations</VaAlert>
  </div>

  <VaModal v-model="showConfirm" title="Confirm" size="small">
    <VaCard>
      <VaCardContent>
        <p>{{ confirmMessage }}</p>
      </VaCardContent>
      <template #actions>
        <VaButton preset="secondary" @click="closeConfirm">Cancel</VaButton>
        <VaButton
          preset="danger"
          @click="confirmTarget && cancelReservation(confirmTarget)"
        >
          {{ confirmActionText }}
        </VaButton>
      </template>
    </VaCard>
  </VaModal>

  <VaModal v-model="notesPopup" title="Reservation Notes" size="small">
    <VaCard>
      <VaCardContent>
        <p>{{ notesContent }}</p>
      </VaCardContent>
    </VaCard>
  </VaModal>
</template>

<style scoped>
.notes-popup-content {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
