<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  VaInput,
  VaButton,
  VaAlert,
  VaCard,
  VaCardTitle,
  VaCardContent,
} from 'vuestic-ui'

import { getApiErrorMessage, getApiErrors } from '@/utils/apiError'
import tableAPI from '@/services/tableAPI'

const table = ref({
  name: '',
  capacity: '',
})

const validationErrors = ref<Record<string, string[]> | null>(null)
const emptyFieldsError = ref<string | null>(null)
const isSuccessful = ref(false)

const staffList = ref([])
const loadingStaff = ref(false)
const selectedStaffIds = ref<number[]>([])

onMounted(async () => {
  await loadWaitingStaff()
})

const loadWaitingStaff = async () => {
  loadingStaff.value = true
  try {
    const res = await tableAPI.getWaitingStaff()
    staffList.value = res.data.staff
  } catch (err) {
    console.error('Failed to load staff', err)
  } finally {
    loadingStaff.value = false
  }
}

const submitTable = async () => {
  emptyFieldsError.value = null
  validationErrors.value = null
  isSuccessful.value = false

  if (!table.value.name || !table.value.capacity) {
    emptyFieldsError.value = 'Please fill in all fields'
    return
  }

  try {
    // TODO: replace with actual table creation API
    isSuccessful.value = true
    table.value = { name: '', capacity: '' }
  } catch (err) {
    console.error('Failed to add table', err)
  }
}
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Add Table</h1>
    </div>
    <div class="content-wrapper">
      <VaCard>
        <VaCardTitle class="card-title">Add Table</VaCardTitle>
        <VaCardContent>
          <form @submit.prevent="submitTable" class="table-form">
            <VaInput
              v-model="table.name"
              label="Table Name"
              :error-messages="validationErrors?.name"
              class="mb-4"
            />
            <VaInput
              v-model="table.capacity"
              label="Capacity"
              type="number"
              min="1"
              :error-messages="validationErrors?.capacity"
              class="mb-4"
            />
            <VaAlert
              v-if="emptyFieldsError"
              color="danger"
              class="mb-4"
            >
              {{ emptyFieldsError }}
            </VaAlert>
            <VaAlert
              v-if="isSuccessful"
              color="success"
              class="mb-4"
            >
              Table added successfully!
            </VaAlert>
            <VaButton type="submit" preset="primary" block>Submit</VaButton>
          </form>
        </VaCardContent>
      </VaCard>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray)
    url("@/assets/images/add-table-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.card-title {
  font-family: 'Inter-Bold';
  font-size: 24px;
}

.table-form {
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
