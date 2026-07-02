<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  VaButton,
  VaCard,
  VaCardContent,
  VaModal,
  VaInput,
  VaTextarea,
  VaAlert,
} from "vuestic-ui";
import { Icon } from "@iconify/vue";
import PageHeader from "@/components/PageHeader.vue";
import { useRoute, useRouter } from "vue-router";
import customerAPI from "@/services/customerAPI";
import reservationAPI from "@/services/reservationAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";

const route = useRoute();
const router = useRouter();
const customerId = route.params.id as string;

const loading = ref(true);
const errorMsg = ref("");
const profile = ref<any>(null);

const customer = computed(() => profile.value?.customer || {});
const history = computed(() => profile.value?.history || []);
const stats = computed(
  () =>
    profile.value?.stats || {
      totalVisits: 0,
      noShowCount: 0,
      noShowRate: 0,
      statusBreakdown: [],
    }
);

const statusColors = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  seated: "#22c55e",
  completed: "#6c757d",
  cancelled: "#ef4444",
  missed: "#ef4444",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  missed: "No-Show",
};

const initials = computed(() => {
  const first = customer.value?.firstName?.charAt(0) || "";
  const last = customer.value?.lastName?.charAt(0) || "";
  return (first + last).toUpperCase();
});

const formattedAddress = computed(() => {
  if (!customer.value) return "";
  const parts = [customer.value.address, customer.value.city].filter(Boolean);
  return parts.join(", ") || "No address on file";
});

const editingTags = ref(false);
const newTag = ref("");
const tagInput = ref(null);
const saveMessage = ref("");
const showSaveMessage = ref(false);

const showEditModal = ref(false);
const editForm = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
});
const editErrors = ref<Record<string, string>>({});

const showQuickReservation = ref(false);
const reservationForm = ref({
  resDate: "",
  resTime: "",
  people: "",
  notes: "",
});
const reservationErrors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const loadProfile = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await customerAPI.getProfile(customerId);
    profile.value = res.data.profile;
  } catch (err: any) {
    errorMsg.value =
      err.response?.data?.message ||
      err.message ||
      "Failed to load customer profile.";
  } finally {
    loading.value = false;
  }
};

const openEditModal = () => {
  editForm.value = {
    firstName: customer.value.firstName || "",
    lastName: customer.value.lastName || "",
    email: customer.value.email || "",
    phone: customer.value.phone || "",
    address: customer.value.address || "",
    city: customer.value.city || "",
    notes: customer.value.notes || "",
  };
  editErrors.value = {};
  showEditModal.value = true;
};

const saveCustomerDetails = async () => {
  editErrors.value = {};
  const errors: Record<string, string> = {};
  if (!editForm.value.firstName.trim())
    errors.firstName = "First name is required";
  if (!editForm.value.lastName.trim())
    errors.lastName = "Last name is required";
  if (!editForm.value.email.trim()) errors.email = "Email is required";
  if (!editForm.value.phone.trim()) errors.phone = "Phone is required";
  if (Object.keys(errors).length > 0) {
    editErrors.value = errors;
    return;
  }
  try {
    const res = await customerAPI.updateCustomer(customerId, editForm.value);
    profile.value = { ...profile.value, customer: res.data.customer };
    showEditModal.value = false;
  } catch (err: any) {
    editErrors.value = {
      submit: getApiErrorMessage(err, "Failed to save changes"),
    };
  }
};

const createReservation = async () => {
  reservationErrors.value = {};
  const errors: Record<string, string> = {};
  if (!reservationForm.value.resDate) errors.resDate = "Date is required";
  if (!reservationForm.value.resTime) errors.resTime = "Time is required";
  if (!reservationForm.value.people) errors.people = "Party size is required";
  if (Object.keys(errors).length > 0) {
    reservationErrors.value = errors;
    return;
  }
  isSubmitting.value = true;
  try {
    await reservationAPI.registerReservation({
      firstName: customer.value.firstName,
      lastName: customer.value.lastName,
      phone: customer.value.phone,
      email: customer.value.email,
      resDate: reservationForm.value.resDate,
      resTime: reservationForm.value.resTime,
      people: reservationForm.value.people,
      notes: reservationForm.value.notes,
      expectedTotal: "",
      paymentStatus: "unpaid",
    });
    showQuickReservation.value = false;
    reservationForm.value = { resDate: "", resTime: "", people: "", notes: "" };
    await loadProfile();
    router.push({ name: "reservations" });
  } catch (err: any) {
    reservationErrors.value = {
      submit: getApiErrorMessage(err, "Failed to create reservation"),
    };
  } finally {
    isSubmitting.value = false;
  }
};

const startEditingTags = () => {
  editingTags.value = true;
  newTag.value = "";
  setTimeout(() => tagInput.value?.focus(), 50);
};

const addTag = () => {
  const tag = newTag.value.trim();
  if (!tag || !customer.value?.tags) return;
  if (customer.value.tags.includes(tag)) return;
  customer.value.tags = [...customer.value.tags, tag];
  newTag.value = "";
  saveTags();
};

const removeTag = (tag: string) => {
  customer.value.tags = customer.value.tags.filter((t) => t !== tag);
  saveTags();
};

const saveTags = async () => {
  try {
    const res = await customerAPI.updateTags(customerId, customer.value.tags);
    profile.value = { ...profile.value, customer: res.data.customer };
    showSaveMessage.value = true;
    saveMessage.value = "Tags saved";
    setTimeout(() => {
      showSaveMessage.value = false;
    }, 2000);
  } catch (err) {
    logger.error("Failed to save customer tags", { error: err.message });
    showSaveMessage.value = true;
    saveMessage.value = "Failed to save tags.";
  }
  editingTags.value = false;
};

const callCustomer = () => {
  window.location.href = `tel:${customer.value.phone}`;
};

const emailCustomer = () => {
  window.location.href = `mailto:${customer.value.email}`;
};

const smsCustomer = () => {
  window.location.href = `sms:${customer.value.phone}`;
};

onMounted(() => {
  if (customerId) {
    loadProfile();
  }
});
</script>

<template>
  <div class="page-wrapper">
    <PageHeader
      :title="
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
        'Customer Profile'
      "
      subtitle="View and manage customer details"
    >
      <template #actions>
        <VaButton
          preset="primary"
          size="small"
          @click="showQuickReservation = true"
        >
          <template #icon>
            <Icon icon="mdi:calendar-plus" width="16" height="16" />
          </template>
          Quick Reservation
        </VaButton>
      </template>
    </PageHeader>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div v-else-if="errorMsg" class="error-state">
        <p>{{ errorMsg }}</p>
        <button class="retry-btn" @click="loadProfile">Retry</button>
      </div>

      <template v-else-if="customer.id">
        <div class="profile-header">
          <div class="customer-avatar">{{ initials }}</div>
          <div class="customer-meta">
            <h2>{{ customer.firstName }} {{ customer.lastName }}</h2>
            <p class="customer-email">{{ customer.email }}</p>
            <p class="customer-phone">{{ customer.phone }}</p>
            <p
              v-if="formattedAddress !== 'No address on file'"
              class="customer-address"
            >
              {{ formattedAddress }}
            </p>
            <div class="customer-stats-row">
              <span class="stat-badge">
                <strong>{{ stats.totalVisits }}</strong> visits
              </span>
              <span class="stat-badge no-show">
                <strong>{{ stats.noShowRate }}%</strong> no-show rate
              </span>
            </div>
          </div>
          <div class="profile-actions">
            <button
              class="action-btn call-btn"
              @click="callCustomer"
              aria-label="Call customer"
            >
              <Icon icon="mdi:phone" width="18" height="18" />
            </button>
            <button
              class="action-btn email-btn"
              @click="emailCustomer"
              aria-label="Email customer"
            >
              <Icon icon="mdi:email-outline" width="18" height="18" />
            </button>
            <button
              class="action-btn sms-btn"
              @click="smsCustomer"
              aria-label="SMS customer"
            >
              <Icon icon="mdi:message-text-outline" width="18" height="18" />
            </button>
            <button class="btn-primary" @click="openEditModal">
              <Icon icon="mdi:pencil-outline" width="16" height="16" />
              Edit
            </button>
          </div>
        </div>

        <div class="sections">
          <div class="section-card">
            <div class="section-header">
              <h3>Tags</h3>
              <button
                v-if="!editingTags"
                class="btn-link"
                @click="startEditingTags"
              >
                Edit
              </button>
            </div>
            <div
              v-if="showSaveMessage"
              class="save-message"
              :class="saveMessage.includes('Failed') ? 'error' : 'success'"
            >
              {{ saveMessage }}
            </div>
            <div v-if="editingTags" class="tags-editor">
              <div class="tags-list">
                <span
                  v-for="tag in customer.tags || []"
                  :key="tag"
                  class="tag-chip"
                >
                  {{ tag }}
                  <button class="tag-remove" @click="removeTag(tag)">×</button>
                </span>
              </div>
              <div class="tag-input-row">
                <input
                  ref="tagInput"
                  v-model="newTag"
                  type="text"
                  placeholder="Add tag..."
                  @keyup.enter="addTag"
                />
                <button class="btn-small" @click="addTag">Add</button>
              </div>
            </div>
            <div v-else class="tags-display">
              <span v-if="!customer.tags?.length" class="no-tags">No tags</span>
              <span
                v-for="tag in customer.tags || []"
                :key="tag"
                class="tag-chip"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="section-card">
            <h3>Reservation History</h3>
            <div v-if="!history.length" class="empty-state-small">
              No reservations yet.
            </div>
            <div v-else class="history-list">
              <div v-for="res in history" :key="res.id" class="history-item">
                <div class="history-main">
                  <span class="history-date">{{ res.resDate }}</span>
                  <span class="history-time">{{ res.resTime }}</span>
                  <span class="history-people">{{ res.people }} people</span>
                </div>
                <div class="history-meta">
                  <span
                    class="status-chip"
                    :style="{
                      backgroundColor: statusColors[res.resStatus] || '#6c757d',
                    }"
                  >
                    {{ statusLabels[res.resStatus] || res.resStatus }}
                  </span>
                  <span v-if="res.paymentStatus" class="payment-chip">
                    {{ res.paymentStatus }}
                  </span>
                  <span v-if="res.expectedTotal" class="history-total">
                    ${{ parseFloat(res.expectedTotal).toFixed(2) }}
                  </span>
                </div>
                <div v-if="res.notes" class="history-notes">
                  {{ res.notes }}
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h3>Notes & Observations</h3>
            <div class="notes-display" v-if="customer.notes">
              <p>{{ customer.notes }}</p>
              <button class="btn-link" @click="openEditModal">
                Edit notes
              </button>
            </div>
            <div v-else class="empty-state-small">
              No notes for this customer.
              <button class="btn-link" @click="openEditModal">Add notes</button>
            </div>
          </div>

          <div class="section-card">
            <h3>Visit Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-value">{{ stats.totalVisits }}</span>
                <span class="stat-label">Total Visits</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ stats.noShowCount }}</span>
                <span class="stat-label">No-Shows</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ stats.noShowRate }}%</span>
                <span class="stat-label">No-Show Rate</span>
              </div>
            </div>
            <div v-if="stats.statusBreakdown?.length" class="breakdown-list">
              <div
                v-for="item in stats.statusBreakdown"
                :key="item.status"
                class="breakdown-row"
              >
                <span
                  class="status-chip small"
                  :style="{
                    backgroundColor: statusColors[item.status] || '#6c757d',
                  }"
                >
                  {{ statusLabels[item.status] || item.status }}
                </span>
                <span class="breakdown-count">{{ item.count }}</span>
                <span v-if="item.totalExpected" class="breakdown-revenue">
                  ${{ parseFloat(item.totalExpected).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <VaModal
      v-model="showQuickReservation"
      title="Quick Reservation"
      size="small"
    >
      <VaCard>
        <VaCardContent>
          <form @submit.prevent="createReservation" class="quick-res-form">
            <div class="form-row">
              <VaInput
                v-model="reservationForm.resDate"
                label="Date"
                type="date"
                :error-messages="reservationErrors.resDate"
              />
              <VaInput
                v-model="reservationForm.resTime"
                label="Time"
                type="time"
                :error-messages="reservationErrors.resTime"
              />
            </div>
            <VaInput
              v-model="reservationForm.people"
              label="Party Size"
              type="number"
              min="1"
              :error-messages="reservationErrors.people"
            />
            <VaTextarea
              v-model="reservationForm.notes"
              label="Special Requests"
              :rows="3"
            />
            <VaAlert
              v-if="reservationErrors.submit"
              color="danger"
              class="mb-4"
            >
              {{ reservationErrors.submit }}
            </VaAlert>
          </form>
        </VaCardContent>
        <template #actions>
          <VaButton preset="secondary" @click="showQuickReservation = false"
            >Cancel</VaButton
          >
          <VaButton
            preset="primary"
            @click="createReservation"
            :loading="isSubmitting"
          >
            Create Reservation
          </VaButton>
        </template>
      </VaCard>
    </VaModal>

    <VaModal v-model="showEditModal" title="Edit Customer" size="small">
      <VaCard>
        <VaCardContent>
          <form @submit.prevent="saveCustomerDetails" class="edit-form">
            <div class="form-row">
              <VaInput
                v-model="editForm.firstName"
                label="First Name"
                :error-messages="editErrors.firstName"
              />
              <VaInput
                v-model="editForm.lastName"
                label="Last Name"
                :error-messages="editErrors.lastName"
              />
            </div>
            <VaInput
              v-model="editForm.email"
              label="Email"
              type="email"
              :error-messages="editErrors.email"
            />
            <VaInput
              v-model="editForm.phone"
              label="Phone"
              :error-messages="editErrors.phone"
            />
            <VaInput v-model="editForm.address" label="Address" />
            <VaInput v-model="editForm.city" label="City" />
            <VaTextarea v-model="editForm.notes" label="Notes" :rows="3" />
            <VaAlert v-if="editErrors.submit" color="danger" class="mb-4">
              {{ editErrors.submit }}
            </VaAlert>
          </form>
        </VaCardContent>
        <template #actions>
          <VaButton preset="secondary" @click="showEditModal = false"
            >Cancel</VaButton
          >
          <VaButton preset="primary" @click="saveCustomerDetails"
            >Save Changes</VaButton
          >
        </template>
      </VaCard>
    </VaModal>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: calc(100vh - var(--header-height));
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  background: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #f3f4f6;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.customer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter-Bold";
  font-size: 24px;
  flex-shrink: 0;
}

.customer-meta {
  flex: 1;
  min-width: 200px;
}

.customer-meta h2 {
  margin: 0 0 4px;
  font-family: "Inter-Bold";
  font-size: 20px;
  color: var(--primary-black);
}

.customer-email,
.customer-phone,
.customer-address {
  margin: 2px 0;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
}

.customer-stats-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f3f4f6;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--primary-black);
}

.stat-badge.no-show {
  background: #fef3c7;
  color: #92400e;
}

.profile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--restaurant-border);
  background: white;
  color: var(--primary-black);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: var(--primary-blue);
  color: var(--primary-blue);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: var(--primary-blue);
  color: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-blue);
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: white;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-card h3 {
  margin: 0 0 12px;
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
}

.save-message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: "Inter-Medium";
  font-size: 13px;
}

.save-message.success {
  background: #d1fae5;
  color: #065f46;
}

.save-message.error {
  background: #fee2e2;
  color: #991b1b;
}

.tags-display,
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #e0e7ff;
  color: #3730a3;
  font-family: "Inter-Medium";
  font-size: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: #3730a3;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.tag-input-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tag-input-row input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
}

.btn-small {
  padding: 8px 12px;
  border: 1px solid var(--primary-blue);
  border-radius: 8px;
  background: var(--primary-blue);
  color: white;
  font-family: "Inter-Medium";
  font-size: 12px;
  cursor: pointer;
}

.no-tags {
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 13px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f0f0f0;
}

.history-main {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.history-date {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
}

.history-time {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.history-people {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.history-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.status-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: white;
  text-transform: uppercase;
}

.status-chip.small {
  font-size: 10px;
  padding: 2px 6px;
}

.payment-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e5e7eb;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--primary-black);
  text-transform: capitalize;
}

.history-total {
  font-family: "Inter-Bold";
  font-size: 12px;
  color: var(--primary-black);
  margin-left: auto;
}

.history-notes {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
  font-style: italic;
}

.notes-display p {
  margin: 0;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  line-height: 1.5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #f0f0f0;
}

.stat-value {
  font-family: "Inter-Bold";
  font-size: 24px;
  color: var(--primary-black);
}

.stat-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
  text-transform: uppercase;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-count {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  min-width: 40px;
}

.breakdown-revenue {
  font-family: "Inter-Bold";
  font-size: 13px;
  color: var(--primary-black);
  margin-left: auto;
}

.empty-state-small {
  text-align: center;
  padding: 24px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.quick-res-form,
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media screen and (min-width: 1024px) {
  .content-wrapper {
    margin-left: var(--x-spacing-desktop);
    margin-right: var(--x-spacing-desktop);
  }
}

@media screen and (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
