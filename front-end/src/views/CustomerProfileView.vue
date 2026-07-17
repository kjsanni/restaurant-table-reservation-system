<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import customerAPI from "@/services/customerAPI";
import PopupBox from "@/components/PopupBox.vue";
import PageHeader from "@/components/PageHeader.vue";
import { useCurrency } from "@/composables/useCurrency";

const { format: fmt } = useCurrency();

const route = useRoute();
const router = useRouter();
const customerId = route.params.id;

const loading = ref(true);
const errorMsg = ref("");
const profile = ref(null);

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

const points = computed(() => customer.value?.points ?? 0);
const preferences = computed(() => customer.value?.preferences || {});
const redeemPointsValue = ref(0);
const redeemError = ref("");
const redeemSuccess = ref(false);

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

const editingTags = ref(false);
const newTag = ref("");
const tagInput = ref(null);
const saveMessage = ref("");
const showSaveMessage = ref(false);

const loadProfile = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await customerAPI.getProfile(customerId);
    if (res.data.profile?.customer) {
      res.data.profile.customer.tags = Array.isArray(
        res.data.profile.customer.tags
      )
        ? res.data.profile.customer.tags
        : [];
    }
    profile.value = res.data.profile;
  } catch {
    errorMsg.value = "Failed to load customer profile.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (customerId) {
    loadProfile();
  }
});

const startEditingTags = () => {
  editingTags.value = true;
  newTag.value = "";
  setTimeout(() => tagInput.value?.focus(), 50);
};

const addTag = () => {
  const tag = newTag.value.trim();
  if (!tag || !customer.value?.tags) return;
  const tags = Array.isArray(customer.value.tags) ? customer.value.tags : [];
  if (tags.includes(tag)) return;
  customer.value.tags = [...tags, tag];
  newTag.value = "";
  saveTags();
};

const removeTag = (tag) => {
  const tags = Array.isArray(customer.value?.tags) ? customer.value.tags : [];
  customer.value.tags = tags.filter((t) => t !== tag);
  saveTags();
};

const saveTags = async () => {
  try {
    await customerAPI.updateTags(customerId, customer.value.tags);
    showSaveMessage.value = true;
    saveMessage.value = "Tags saved";
    setTimeout(() => {
      showSaveMessage.value = false;
    }, 2000);
  } catch {
    showSaveMessage.value = true;
    saveMessage.value = "Failed to save tags";
  }
  editingTags.value = false;
};

const navigateToNewReservation = () => {
  router.push({ path: "/new-reservation", query: { customerId } });
};

const markVisit = async () => {
  try {
    await customerAPI.incrementVisit(customerId);
    await loadProfile();
  } catch {
    errorMsg.value = "Failed to mark visit.";
  }
};

const submitRedeem = async () => {
  redeemError.value = "";
  redeemSuccess.value = false;
  if (!redeemPointsValue.value || redeemPointsValue.value <= 0) {
    redeemError.value = "Enter a valid points amount.";
    return;
  }
  if (redeemPointsValue.value > points.value) {
    redeemError.value = "Customer does not have enough points.";
    return;
  }
  try {
    await customerAPI.redeemPoints(customerId, redeemPointsValue.value);
    redeemSuccess.value = true;
    redeemPointsValue.value = 0;
    await loadProfile();
  } catch {
    redeemError.value = "Failed to redeem points.";
  }
};

const savePreferences = async () => {
  try {
    await customerAPI.updatePreferences(customerId, preferences.value);
    showSaveMessage.value = true;
    saveMessage.value = "Preferences saved";
    setTimeout(() => {
      showSaveMessage.value = false;
    }, 2000);
  } catch {
    showSaveMessage.value = true;
    saveMessage.value = "Failed to save preferences";
  }
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Customer Profile"
      subtitle="View customer details and history"
    />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div v-else-if="errorMsg" class="error-state">
        <p>{{ errorMsg }}</p>
        <button class="retry-btn" @click="loadProfile">Retry</button>
      </div>

      <template v-else-if="customer">
        <div class="profile-header">
          <div class="customer-avatar">
            {{ customer.firstName?.charAt(0)
            }}{{ customer.lastName?.charAt(0) }}
          </div>
          <div class="customer-meta">
            <h2>{{ customer.firstName }} {{ customer.lastName }}</h2>
            <p class="customer-email">{{ customer.email }}</p>
            <p class="customer-phone">{{ customer.phone }}</p>
            <div class="customer-stats-row">
              <span class="stat-badge">
                <strong>{{ stats.totalVisits }}</strong> visits
              </span>
              <span class="stat-badge no-show">
                <strong>{{ stats.noShowRate }}%</strong> no-show rate
              </span>
              <span class="stat-badge loyalty">
                <strong>{{ points }}</strong> points
              </span>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn-primary" @click="navigateToNewReservation">
              New Reservation
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
                <label for="tag-input" class="sr-only">Add tag</label>
                <input
                  ref="tagInput"
                  id="tag-input"
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
                    {{ fmt(res.expectedTotal) }}
                  </span>
                </div>
                <div v-if="res.notes" class="history-notes">
                  {{ res.notes }}
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h3>Loyalty</h3>
            <div class="loyalty-row">
              <div class="loyalty-stat">
                <span class="stat-value">{{ points }}</span>
                <span class="stat-label">Points</span>
              </div>
              <div class="loyalty-actions">
                <button class="btn-small" @click="markVisit">+ Visit</button>
                <button class="btn-small" @click="addPoints">+ Points</button>
              </div>
            </div>
            <div class="redeem-row">
              <input
                type="number"
                v-model="redeemPointsValue"
                placeholder="Points to redeem"
                class="redeem-input"
              />
              <button class="btn-small danger" @click="submitRedeem">
                Redeem
              </button>
            </div>
            <div v-if="redeemError" class="save-message error">
              {{ redeemError }}
            </div>
            <div v-if="redeemSuccess" class="save-message success">
              Redeemed successfully
            </div>
          </div>

          <div class="section-card">
            <h3>Preferences</h3>
            <div class="preferences-grid">
              <label class="pref-item">
                <input
                  type="checkbox"
                  v-model="preferences.emailReminders"
                  @change="savePreferences"
                />
                <span>Email reminders</span>
              </label>
              <label class="pref-item">
                <input
                  type="checkbox"
                  v-model="preferences.smsReminders"
                  @change="savePreferences"
                />
                <span>SMS reminders</span>
              </label>
              <label class="pref-item">
                <input
                  type="checkbox"
                  v-model="preferences.quietHours"
                  @change="savePreferences"
                />
                <span>Quiet hours</span>
              </label>
              <label class="pref-item">
                <input
                  type="checkbox"
                  v-model="preferences.disableAll"
                  @change="savePreferences"
                />
                <span>Disable all reminders</span>
              </label>
            </div>
            <div class="save-row">
              <button class="btn-link" @click="savePreferences">
                Save preferences
              </button>
              <span
                v-if="showSaveMessage"
                class="save-message"
                :class="saveMessage.includes('Failed') ? 'error' : 'success'"
              >
                {{ saveMessage }}
              </span>
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
                  {{ fmt(item.totalExpected) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <PopupBox
        :is-open="false"
        header-text="Quick Reservation"
        :is-closable="true"
      >
        <template #popup-content>
          <p>Quick reservation form would open here.</p>
        </template>
      </PopupBox>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-wrapper {
  margin-top: var(--page-margin-y);
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
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--sky-600);
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
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid var(--border);
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
  align-items: center;
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
  color: var(--ink);
}

.customer-email,
.customer-phone {
  margin: 2px 0;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--ink-muted);
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
  color: var(--ink);
}

.stat-badge.no-show {
  background: #fef3c7;
  color: #92400e;
}

.stat-badge.loyalty {
  background: #dbeafe;
  color: #1e40af;
}

.profile-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--sky-600);
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
  color: var(--sky-600);
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
  color: var(--ink);
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
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
}

.btn-small {
  padding: 8px 12px;
  border: 1px solid var(--sky-600);
  border-radius: 8px;
  background: var(--sky-600);
  color: white;
  font-family: "Inter-Medium";
  font-size: 12px;
  cursor: pointer;
}

.no-tags {
  color: var(--ink-muted);
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
  color: var(--ink);
}

.history-time {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
}

.history-people {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
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
  color: var(--ink);
  text-transform: capitalize;
}

.history-total {
  font-family: "Inter-Bold";
  font-size: 12px;
  color: var(--ink);
  margin-left: auto;
}

.history-notes {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
  font-style: italic;
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
  color: var(--ink);
}

.stat-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--ink-muted);
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
  color: var(--ink);
  min-width: 40px;
}

.breakdown-revenue {
  font-family: "Inter-Bold";
  font-size: 13px;
  color: var(--ink);
  margin-left: auto;
}

.loyalty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.loyalty-actions {
  display: flex;
  gap: 8px;
}

.redeem-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.redeem-input {
  padding: 8px 10px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
  width: 180px;
}

.btn-small.danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.btn-small.danger:hover {
  background: #fecaca;
}

.preferences-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.pref-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  cursor: pointer;
}

.save-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state-small {
  text-align: center;
  padding: 24px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}
</style>
