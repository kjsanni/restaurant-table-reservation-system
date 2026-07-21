<script setup lang="ts">
import { ref, onMounted } from "vue";
import promotionAPI from "@/services/promotionAPI";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const { format: fmt } = useCurrency();

const promotions = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref<number | null>(null);

const form = ref({
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  isActive: true,
  validFrom: "",
  validUntil: "",
});

const editingId = ref<number | null>(null);

onMounted(async () => {
  await loadPromotions();
});

const loadPromotions = async () => {
  loading.value = true;
  try {
    const res = await promotionAPI.getPromotions();
    promotions.value = res.data?.collection || res.data || [];
  } catch (err) {
    logger.error("Failed to load promotions", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    isActive: true,
    validFrom: "",
    validUntil: "",
  };
  editingId.value = null;
};

const startEdit = (promo: any) => {
  editingId.value = promo.id;
  form.value = {
    code: promo.code,
    description: promo.description || "",
    discountType: promo.discountType,
    discountValue: String(promo.discountValue || ""),
    minOrderAmount: String(promo.minOrderAmount || ""),
    maxDiscountAmount: String(promo.maxDiscountAmount || ""),
    usageLimit: String(promo.usageLimit || ""),
    isActive: promo.isActive,
    validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : "",
    validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : "",
  };
};

const submitForm = async () => {
  saving.value = true;
  try {
    const payload: any = {
      code: form.value.code.toUpperCase(),
      description: form.value.description || null,
      discountType: form.value.discountType,
      discountValue: parseFloat(form.value.discountValue),
      minOrderAmount: form.value.minOrderAmount
        ? parseFloat(form.value.minOrderAmount)
        : 0,
      maxDiscountAmount: form.value.maxDiscountAmount
        ? parseFloat(form.value.maxDiscountAmount)
        : null,
      usageLimit: form.value.usageLimit
        ? parseInt(form.value.usageLimit, 10)
        : null,
      isActive: form.value.isActive,
      validFrom: form.value.validFrom || null,
      validUntil: form.value.validUntil || null,
    };

    if (editingId.value) {
      await promotionAPI.updatePromotion(editingId.value, payload);
    } else {
      await promotionAPI.createPromotion(payload);
    }

    resetForm();
    await loadPromotions();
  } catch (err) {
    logger.error("Failed to save promotion", { error: err });
  } finally {
    saving.value = false;
  }
};

const deletePromotion = async (id: number) => {
  if (!confirm("Delete this promotion?")) return;
  deleting.value = id;
  try {
    await promotionAPI.deletePromotion(id);
    await loadPromotions();
  } catch (err) {
    logger.error("Failed to delete promotion", { error: err });
  } finally {
    deleting.value = null;
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Promotions</h1>
        <p>Create and manage discount codes</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="layout">
        <div class="form-card">
          <h2>{{ editingId ? "Edit Promotion" : "New Promotion" }}</h2>
          <div class="form-grid">
            <div class="field">
              <label>Code</label>
              <input
                v-model="form.code"
                placeholder="SUMMER25"
                :disabled="!!editingId"
              />
            </div>
            <div class="field">
              <label>Type</label>
              <select v-model="form.discountType">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div class="field">
              <label>Value</label>
              <input
                v-model.number="form.discountValue"
                type="number"
                step="0.01"
                placeholder="10"
              />
            </div>
            <div class="field">
              <label>Min order (GHS)</label>
              <input
                v-model.number="form.minOrderAmount"
                type="number"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div class="field">
              <label>Max discount (GHS)</label>
              <input
                v-model.number="form.maxDiscountAmount"
                type="number"
                step="0.01"
                placeholder="optional"
              />
            </div>
            <div class="field">
              <label>Usage limit</label>
              <input
                v-model.number="form.usageLimit"
                type="number"
                placeholder="unlimited"
              />
            </div>
            <div class="field">
              <label>Valid from</label>
              <input v-model="form.validFrom" type="date" />
            </div>
            <div class="field">
              <label>Valid until</label>
              <input v-model="form.validUntil" type="date" />
            </div>
            <div class="field checkbox">
              <label>
                <input v-model="form.isActive" type="checkbox" />
                Active
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="submitForm">
              {{ saving ? "Saving…" : editingId ? "Update" : "Create" }}
            </button>
            <button v-if="editingId" class="btn-ghost" @click="resetForm">
              Cancel
            </button>
          </div>
        </div>

        <div class="list-card">
          <h2>Promotions</h2>
          <div v-if="loading" class="state">Loading…</div>
          <div v-else-if="!promotions.length" class="state">
            No promotions yet.
          </div>
          <div v-else class="promo-list">
            <div v-for="promo in promotions" :key="promo.id" class="promo-item">
              <div class="promo-main">
                <div class="promo-code">{{ promo.code }}</div>
                <div class="promo-meta">
                  {{
                    promo.discountType === "percentage"
                      ? promo.discountValue + "%"
                      : fmt(promo.discountValue)
                  }}
                  <span v-if="promo.minOrderAmount > 0"
                    >· min {{ fmt(promo.minOrderAmount) }}</span
                  >
                </div>
                <div class="promo-usage">
                  Used {{ promo.usedCount
                  }}{{ promo.usageLimit ? ` / ${promo.usageLimit}` : "" }}
                </div>
              </div>
              <div class="promo-actions">
                <button class="btn-small" @click="startEdit(promo)">
                  Edit
                </button>
                <button
                  class="btn-small btn-danger"
                  @click="deletePromotion(promo.id)"
                  :disabled="deleting === promo.id"
                >
                  {{ deleting === promo.id ? "…" : "Delete" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-card,
.list-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.form-card h2,
.list-card h2 {
  margin: 0 0 16px;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field input,
.field select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus,
.field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--ink-secondary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-small.btn-danger {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.state {
  text-align: center;
  padding: 40px 20px;
  color: var(--ink-muted);
}

.promo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.promo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.promo-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.promo-code {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
}

.promo-meta {
  font-size: 13px;
  color: var(--ink-secondary);
}

.promo-usage {
  font-size: 12px;
  color: var(--ink-muted);
}

.promo-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
