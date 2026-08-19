<template>
  <div class="tenant-switcher">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search tenants..."
      class="tenant-search"
      @input="onSearchInput"
    />
    <select :value="modelValue" @change="onChange" class="tenant-select">
      <option value="">Platform Admin</option>
      <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
        {{ tenant.name }} ({{ tenant.slug }})
      </option>
    </select>
    <button v-if="hasMore" @click="loadMore" class="tenant-load-more">
      Load more
    </button>
    <span v-if="total > 0" class="tenant-total">{{ total }} venues</span>
    <div v-if="error" class="tenant-error">
      <span>{{ error }}</span>
      <button @click="retryLoadTenants" class="tenant-retry">Retry</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const authStore = useAuthStore();
const tenants = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);
const total = ref(0);
const searchQuery = ref("");
const error = ref("");
let searchDebounce = null;

const loadTenants = async (pageNum = 1, search = "") => {
  try {
    const response = await tenantAdminAPI.getAll({
      page: pageNum,
      pageSize,
      search: search || undefined,
    });
    const data = response.data;
    if (pageNum === 1) {
      tenants.value = data.collection || [];
    } else {
      tenants.value = [...tenants.value, ...(data.collection || [])];
    }
    hasMore.value = (data.collection?.length || 0) >= pageSize;
    total.value = data.total || 0;
    page.value = pageNum;
    error.value = "";
  } catch (err) {
    error.value = err?.message || "Failed to load tenants";
  }
};

const retryLoadTenants = () => {
  loadTenants(page.value, searchQuery.value);
};

const loadMore = () => {
  loadTenants(page.value + 1, searchQuery.value);
};

const onSearchInput = () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    loadTenants(1, searchQuery.value);
  }, 300);
};

const onChange = (event) => {
  const tenantId = event.target.value;
  if (!tenantId) {
    authStore.clearTenant();
    emit("update:modelValue", "");
    return;
  }
  const tenant = tenants.value.find((t) => String(t.id) === String(tenantId));
  if (tenant) {
    authStore.setTenant(tenant);
    emit("update:modelValue", tenant.id);
  }
};

onMounted(() => {
  loadTenants();
});
</script>

<style scoped>
.tenant-switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tenant-search {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #e3e8ee);
  background: #ffffff;
  font-size: 13px;
  color: var(--ink, #0d253d);
  min-width: 160px;
}
.tenant-search:focus {
  outline: 2px solid var(--accent, #d97706);
  outline-offset: 1px;
}
.tenant-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #e3e8ee);
  background: #ffffff;
  font-size: 13px;
  color: var(--ink, #0d253d);
  cursor: pointer;
  min-width: 180px;
}
.tenant-select:focus {
  outline: 2px solid var(--accent, #d97706);
  outline-offset: 1px;
}
.tenant-load-more {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #e3e8ee);
  background: #f8fafc;
  font-size: 12px;
  cursor: pointer;
}
.tenant-load-more:hover {
  background: #e2e8f0;
}
.tenant-total {
  font-size: 12px;
  color: var(--ink-muted, #64748b);
  white-space: nowrap;
}
.tenant-error {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--rose-600, #e11d48);
}
.tenant-retry {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #e3e8ee);
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: var(--ink, #0d253d);
}
.tenant-retry:hover {
  background: #f1f5f9;
}
</style>
