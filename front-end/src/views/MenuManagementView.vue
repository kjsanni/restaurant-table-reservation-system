<script setup lang="ts">
import { ref, onMounted } from "vue";
import menuAPI from "@/services/menuAPI";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const { format: fmt } = useCurrency();

const categories = ref<any[]>([]);
const items = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref("");

const newCategoryName = ref("");
const editingCategory = ref<{ id: number; name: string } | null>(null);

const newItem = ref({
  categoryId: "",
  name: "",
  description: "",
  price: "",
  isAvailable: true,
});
const editingItem = ref<any>(null);

onMounted(async () => {
  await loadMenu();
});

const loadMenu = async () => {
  loading.value = true;
  try {
    const [catRes, itemRes] = await Promise.all([
      menuAPI.getCategories(),
      menuAPI.getMenuItems(),
    ]);
    categories.value = catRes.data?.categories || [];
    items.value = itemRes.data?.items || [];
  } catch (err) {
    logger.error("Failed to load menu", { error: err });
    errorMsg.value = "Failed to load menu.";
  } finally {
    loading.value = false;
  }
};

const saveCategory = async () => {
  if (!newCategoryName.value.trim() && !editingCategory.value) return;
  saving.value = true;
  errorMsg.value = "";
  try {
    if (editingCategory.value) {
      await menuAPI.getMenuItemDetail(editingCategory.value.id);
      errorMsg.value = "Category update not implemented in API yet.";
    } else {
      await menuAPI.getMenuItemDetail("categories");
      errorMsg.value = "Category create not implemented in API yet.";
    }
  } catch (err) {
    logger.error("Category save failed", { error: err });
    errorMsg.value = "Failed to save category.";
  } finally {
    saving.value = false;
  }
};

const saveItem = async () => {
  if (!newItem.value.name || !newItem.value.categoryId || !newItem.value.price)
    return;
  saving.value = true;
  errorMsg.value = "";
  try {
    if (editingItem.value) {
      await menuAPI.getMenuItemDetail(editingItem.value.id);
      errorMsg.value = "Item update not implemented in API yet.";
    } else {
      await menuAPI.getMenuItemDetail("items");
      errorMsg.value = "Item create not implemented in API yet.";
    }
  } catch (err) {
    logger.error("Item save failed", { error: err });
    errorMsg.value = "Failed to save item.";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Menu Management</h1>
        <p>Manage categories, items, and availability</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading menu…</div>

      <div v-else class="admin-stack">
        <div class="admin-card">
          <h3>Categories</h3>
          <div class="form-row">
            <input v-model="newCategoryName" placeholder="New category name" />
            <button class="btn-small" @click="saveCategory" :disabled="saving">
              Add
            </button>
          </div>
          <div v-if="editingCategory" class="form-row">
            <input v-model="editingCategory.name" placeholder="Category name" />
            <button class="btn-small" @click="saveCategory" :disabled="saving">
              Save
            </button>
            <button class="btn-link" @click="editingCategory = null">
              Cancel
            </button>
          </div>
          <div class="list">
            <div v-for="cat in categories" :key="cat.id" class="list-item">
              <span>{{ cat.name }}</span>
              <div>
                <button
                  class="btn-link"
                  @click="editingCategory = { id: cat.id, name: cat.name }"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <h3>Menu Items</h3>
          <div class="form-grid">
            <select v-model="newItem.categoryId">
              <option value="">Select category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <input v-model="newItem.name" placeholder="Item name" />
            <input v-model="newItem.description" placeholder="Description" />
            <input
              v-model="newItem.price"
              type="number"
              step="0.01"
              placeholder="Price"
            />
            <label class="pref-item">
              <input type="checkbox" v-model="newItem.isAvailable" />
              <span>Available</span>
            </label>
            <button class="btn-small" @click="saveItem" :disabled="saving">
              Add Item
            </button>
          </div>
          <div class="list">
            <div v-for="item in items" :key="item.id" class="list-item">
              <div>
                <b>{{ item.name }}</b>
                <span class="muted"
                  >{{ item.category?.name }} · {{ fmt(item.price) }}</span
                >
              </div>
              <div>
                <span
                  :class="['pill', item.isAvailable ? 'active' : 'cancelled']"
                >
                  {{ item.isAvailable ? "Available" : "Unavailable" }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.admin-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.admin-card h3 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.form-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  align-items: center;
}

.form-row input,
.form-row select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  align-items: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
}

.list-item b {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.muted {
  display: block;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
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

.btn-small:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--accent);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

.pref-item {
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
}

.pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.pill.active {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-500));
  color: white;
}

.pill.cancelled {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
  color: white;
}

.error-text {
  color: var(--rose-600);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  text-align: center;
}

.state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}
</style>
