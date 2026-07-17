<template>
  <div class="tenant-switcher">
    <select
      :value="modelValue"
      @change="onChange"
      class="tenant-select"
    >
      <option value="">Platform Admin</option>
      <option
        v-for="tenant in tenants"
        :key="tenant.id"
        :value="tenant.id"
      >
        {{ tenant.name }} ({{ tenant.slug }})
      </option>
    </select>
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

const loadTenants = async () => {
  try {
    const response = await tenantAdminAPI.getAll();
    tenants.value = response.data.collection || [];
  } catch {
    // ignore
  }
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
</style>
