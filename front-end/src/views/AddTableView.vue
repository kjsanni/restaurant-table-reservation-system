<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  VaAlert,
  VaBadge,
  VaButton,
  VaCard,
  VaCardContent,
  VaCardTitle,
  VaInput,
} from "vuestic-ui";

import tableAPI from "@/services/tableAPI";

const table = ref({
  name: "",
  capacity: "",
});

const validationErrors = ref<Record<string, string[]> | null>(null);
const emptyFieldsError = ref<string | null>(null);

const featureEnabled = ref(false);

onMounted(async () => {
  try {
    const res = await tableAPI.getWaitingStaff();
    console.log("Table creation endpoint status check:", res);
    featureEnabled.value = false;
  } catch {
    featureEnabled.value = false;
  }
});

const submitTable = async () => {
  emptyFieldsError.value =
    "Table creation is not yet available. Please use the Floor Plan to manage tables.";
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Add Table" subtitle="Create a new table" />
    <div class="content-wrapper">
      <VaCard>
        <VaCardTitle class="card-title">Add Table</VaCardTitle>
        <VaCardContent>
          <div class="disabled-notice">
            <VaBadge color="warning" class="mb-4">Coming Soon</VaBadge>
            <p class="disabled-text">
              Table creation from this form is not yet available. Please use the
              <RouterLink to="/floor-plan" class="inline-link"
                >Floor Plan</RouterLink
              >
              or
              <RouterLink to="/tables/manage" class="inline-link"
                >Table Management</RouterLink
              >
              views for table operations.
            </p>
          </div>
          <form
            @submit.prevent="submitTable"
            class="table-form"
            aria-disabled="true"
          >
            <VaInput
              v-model="table.name"
              label="Table Name"
              :error-messages="validationErrors?.name"
              class="mb-4"
              disabled
            />
            <VaInput
              v-model="table.capacity"
              label="Capacity"
              type="number"
              min="1"
              :error-messages="validationErrors?.capacity"
              class="mb-4"
              disabled
            />
            <VaAlert v-if="emptyFieldsError" color="danger" class="mb-4">
              {{ emptyFieldsError }}
            </VaAlert>
            <VaButton type="submit" preset="primary" block disabled
              >Submit</VaButton
            >
          </form>
        </VaCardContent>
      </VaCard>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.card-title {
  font-family: "Inter-Bold";
  font-size: 24px;
}

.table-form {
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.disabled-notice {
  margin-bottom: 20px;
}

.disabled-text {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
  line-height: 1.5;
  margin: 0;
}

.inline-link {
  color: var(--primary-blue);
  text-decoration: underline;
  font-weight: normal;
}

.inline-link:hover {
  color: #2563eb;
}
</style>
