<template>
  <div class="grace-page">
    <div class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>Grace Period Settings</h1>
        <p class="subtitle">
          Configure payment grace period for {{ tenant.name || "this tenant" }}
        </p>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Current Grace Period</h2>
        <div class="info-row">
          <span class="label">Tenant Override</span>
          <span class="value"
            >{{ grace.tenantDays !== null ? grace.tenantDays : "—" }} days</span
          >
        </div>
        <div class="info-row">
          <span class="label">Global Default</span>
          <span class="value">{{ grace.globalDefaultDays }} days</span>
        </div>
        <div class="info-row">
          <span class="label">Plan Default</span>
          <span class="value"
            >{{
              grace.planDefaultDays !== null ? grace.planDefaultDays : "—"
            }}
            days</span
          >
        </div>
      </div>

      <div class="card">
        <h2>Override Per Tenant</h2>
        <p class="section-hint">
          Set a custom grace period (in days) for this tenant. Leave blank to
          use the plan or global default.
        </p>
        <div class="field">
          <label>Grace Period (days)</label>
          <input
            v-model.number="form.days"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 7"
          />
        </div>
        <div class="actions">
          <button class="btn-primary" @click="saveGrace" :disabled="saving">
            {{ saving ? "Saving..." : "Save Grace Period" }}
          </button>
          <span v-if="saved" class="saved-tag">Saved</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import gracePeriodAPI from "@/services/gracePeriodAPI";

const route = useRoute();
const tenant = ref({ name: "" });
const grace = ref({
  tenantDays: null,
  globalDefaultDays: 3,
  planDefaultDays: null,
});
const form = ref({ days: null });
const saving = ref(false);
const saved = ref(false);

const loadData = async () => {
  try {
    const [tenantRes, graceRes] = await Promise.all([
      tenantAdminAPI.getById(route.params.id),
      gracePeriodAPI.getGracePeriod(route.params.id),
    ]);
    tenant.value = tenantRes.data.item || {};
    grace.value = graceRes.data || grace.value;
    form.value.days = grace.value.tenantDays;
  } catch (err) {
    console.error("Failed to load grace period", err);
  }
};

const saveGrace = async () => {
  saving.value = true;
  saved.value = false;
  try {
    const payload =
      form.value.days !== null && form.value.days !== ""
        ? { days: Number(form.value.days) }
        : { days: null };
    await gracePeriodAPI.updateGracePeriod(route.params.id, payload.days);
    await loadData();
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } catch (err) {
    alert(err.response?.data?.message || "Failed to save grace period");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.grace-page {
  padding: var(--space-6);
  max-width: 960px;
}
.page-header {
  margin-bottom: var(--space-6);
}
.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}
.back-btn:hover {
  color: var(--accent-600);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: var(--space-1) 0 0 0;
  font-size: var(--text-sm);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-4) 0;
  color: var(--ink);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.value {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.section-hint {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-relaxed);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 500;
}
.field input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-primary:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.saved-tag {
  color: var(--earth-600);
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
