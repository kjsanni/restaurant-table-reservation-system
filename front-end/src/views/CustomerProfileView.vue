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
                  <span class="status-chip" :class="res.resStatus || 'default'">
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
                  :class="item.status || 'default'"
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
  padding: var(--space-20) var(--space-5);
  gap: var(--space-4);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: var(--space-20) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.retry-btn {
  margin-top: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.retry-btn:hover {
  background: var(--neutral-100);
  border-color: var(--accent);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.customer-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  flex-shrink: 0;
}

.customer-meta {
  flex: 1;
  min-width: 200px;
}

.customer-meta h2 {
  margin: 0 0 var(--space-1) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--ink);
}

.customer-email,
.customer-phone {
  margin: var(--space-0-5) 0;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.customer-stats-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ink);
}

.stat-badge.no-show {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.stat-badge.loyalty {
  background: var(--sky-50);
  color: var(--sky-600);
}

.profile-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-primary {
  padding: var(--space-2) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: color var(--duration-150) var(--ease-in-out);
}

.btn-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-card h3 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.save-message {
  margin-bottom: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
}

.save-message.success {
  background: var(--earth-50);
  color: var(--earth-600);
}

.save-message.error {
  background: var(--rose-50);
  color: var(--rose-600);
}

.tags-display,
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-full);
  background: var(--brand-100);
  color: var(--brand-700);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--brand-700);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.7;
  transition: opacity var(--duration-150) var(--ease-in-out);
}

.tag-remove:hover {
  opacity: 1;
}

.tag-input-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.tag-input-row input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.tag-input-row input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.btn-small {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-small:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.no-tags {
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
  transition: box-shadow var(--duration-150) var(--ease-in-out);
}

.history-item:hover {
  box-shadow: var(--shadow-sm);
}

.history-main {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}

.history-date {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
}

.history-time {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.history-people {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.history-meta {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.status-chip {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.status-chip.small {
  font-size: 10px;
  padding: var(--space-0-5) var(--space-1-5);
}

.status-chip.pending {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
}

.status-chip.confirmed {
  background: linear-gradient(135deg, var(--sky-400), var(--sky-500));
}

.status-chip.seated {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
}

.status-chip.completed {
  background: linear-gradient(135deg, var(--neutral-400), var(--neutral-500));
}

.status-chip.cancelled {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}

.status-chip.missed {
  background: linear-gradient(135deg, var(--rose-500), var(--rose-600));
}

.status-chip.default {
  background: linear-gradient(135deg, var(--neutral-400), var(--neutral-500));
}

.payment-chip {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--ink-secondary);
  text-transform: capitalize;
}

.history-total {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-xs);
  color: var(--ink);
  margin-left: auto;
}

.history-notes {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-style: italic;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4);
  border-radius: var(--card-radius);
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
}

.stat-value {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-2xl);
  color: var(--ink);
}

.stat-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: var(--space-2-5);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-count {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  min-width: 40px;
}

.breakdown-revenue {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
  margin-left: auto;
}

.loyalty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.loyalty-actions {
  display: flex;
  gap: var(--space-2);
}

.redeem-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.redeem-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  width: 180px;
  background: var(--surface);
  color: var(--ink);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.redeem-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.btn-small.danger {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}

.btn-small.danger:hover {
  background: var(--rose-100);
  transform: translateY(-1px);
}

.preferences-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2-5);
  margin-bottom: var(--space-3);
}

.pref-item {
  display: flex;
  align-items: center;
  gap: var(--space-2-5);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
}

.save-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.empty-state-small {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}
</style>
