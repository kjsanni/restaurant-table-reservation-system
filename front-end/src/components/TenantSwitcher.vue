<template>
  <div class="tenant-switcher">
    <select :value="modelValue" @change="onChange" class="tenant-select">
      <option value="">Platform Admin</option>
      <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
        {{ tenant.name }} ({{ tenant.slug }})
      </option>
    </select>
    <button v-if="hasMore" @click="loadMore" class="tenant-load-more">
      Load more
    </button>
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

const loadTenants = async (pageNum = 1) => {
  try {
    const response = await tenantAdminAPI.getAll({ page: pageNum, pageSize });
    const data = response.data;
    if (pageNum === 1) {
      tenants.value = data.collection || [];
    } else {
      tenants.value = [...tenants.value, ...(data.collection || [])];
    }
    hasMore.value = (data.collection?.length || 0) >= pageSize;
    page.value = pageNum;
  } catch {
    // ignore
  }
};

const loadMore = () => {
  loadTenants(page.value + 1);
};

const onChange = (event) => {
  const tenantId = event.target.value;
  if (!tenantId) {
    authStore.clearTenant();
    emit("update:modelValue", "");
    return;
  }
  const tenant = tenants.value.find((t) => t.id === tenantId);
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
</style>
