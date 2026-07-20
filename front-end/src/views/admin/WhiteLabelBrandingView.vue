<template>
  <div class="branding-page">
    <div class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>White-label Branding</h1>
        <p class="subtitle">
          Customize the look and feel for {{ tenant.name || "this tenant" }}
        </p>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Branding Settings</h2>
        <p class="section-hint">
          Update the tenant's public-facing branding. Changes apply immediately
          to the tenant's portal and customer-facing pages.
        </p>
        <div class="field">
          <label>Logo URL</label>
          <input
            v-model="form.logoUrl"
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div class="field">
          <label>Primary Color</label>
          <div class="color-input-row">
            <input
              v-model="form.primaryColor"
              type="color"
              class="color-picker"
            />
            <input
              v-model="form.primaryColor"
              placeholder="#d97706"
              class="color-text"
            />
          </div>
        </div>
        <div class="field">
          <label>Custom Domain</label>
          <input
            v-model="form.customDomain"
            placeholder="reservations.example.com"
          />
        </div>
        <div class="actions">
          <button class="btn-primary" @click="saveBranding" :disabled="saving">
            {{ saving ? "Saving..." : "Save Branding" }}
          </button>
          <span v-if="saved" class="saved-tag">Saved</span>
        </div>
      </div>

      <div class="card preview-card">
        <h2>Preview</h2>
        <div class="preview-frame" :style="previewStyles">
          <div class="preview-header">
            <div class="preview-logo">
              <img
                v-if="preview.logoUrl"
                :src="preview.logoUrl"
                alt="Logo"
                class="preview-logo-img"
              />
              <span v-else class="preview-logo-placeholder">Logo</span>
            </div>
            <span class="preview-domain">{{
              preview.customDomain || "tenant.app"
            }}</span>
          </div>
          <div class="preview-body">
            <div
              class="preview-cta"
              :style="{ background: preview.primaryColor }"
            >
              Reserve a Table
            </div>
            <div class="preview-chips">
              <span class="preview-chip">Menu</span>
              <span class="preview-chip">Hours</span>
              <span class="preview-chip">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToastStore } from "@/stores/toast";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import whiteLabelAPI from "@/services/whiteLabelAPI";

const toastStore = useToastStore();

const route = useRoute();
const tenant = ref({ name: "" });
const branding = ref({
  logoUrl: "",
  primaryColor: "#d97706",
  customDomain: "",
});
const form = ref({ logoUrl: "", primaryColor: "#d97706", customDomain: "" });
const saving = ref(false);
const saved = ref(false);

const preview = computed(() => ({
  logoUrl: form.value.logoUrl,
  primaryColor: form.value.primaryColor || "#d97706",
  customDomain: form.value.customDomain,
}));

const previewStyles = computed(() => ({
  borderColor: preview.value.primaryColor || "#d97706",
}));

const loadData = async () => {
  try {
    const [tenantRes, brandRes] = await Promise.all([
      tenantAdminAPI.getById(route.params.id),
      whiteLabelAPI.getBranding(route.params.id),
    ]);
    tenant.value = tenantRes.data.item || {};
    branding.value = brandRes.data || branding.value;
    form.value = {
      logoUrl: branding.value.logoUrl || "",
      primaryColor: branding.value.primaryColor || "#d97706",
      customDomain: branding.value.customDomain || "",
    };
  } catch (err) {
    console.error("Failed to load branding", err);
  }
};

const saveBranding = async () => {
  saving.value = true;
  saved.value = false;
  try {
    await whiteLabelAPI.updateBranding(route.params.id, {
      logoUrl: form.value.logoUrl || null,
      primaryColor: form.value.primaryColor || null,
      customDomain: form.value.customDomain || null,
    });
    await loadData();
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } catch (err) {
    toastStore.add(
      err.response?.data?.message || "Failed to save branding",
      "error",
      4000
    );
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.branding-page {
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
.field input[type="text"] {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.field input[type="text"]:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.color-input-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.color-picker {
  width: var(--space-10);
  height: var(--space-10);
  padding: var(--space-0);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  background: var(--surface);
}
.color-text {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.color-text:focus {
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
.preview-frame {
  border: 2px solid;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--surface);
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--neutral-50);
  border-bottom: 1px solid var(--border-subtle);
}
.preview-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.preview-logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
}
.preview-logo-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-200);
  color: var(--ink-muted);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
}
.preview-domain {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.preview-body {
  padding: var(--space-6);
  text-align: center;
}
.preview-cta {
  display: inline-block;
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-full);
  color: var(--white);
  font-weight: 600;
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}
.preview-chips {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}
.preview-chip {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
</style>
