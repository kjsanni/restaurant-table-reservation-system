<script setup lang="ts">
import SaveIcon from "~icons/fluent/save-16-regular";

import reservationAPI from "@/services/reservationAPI";
import { ref } from "vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";

interface TableOption {
  id: number;
  name: string;
}

const props = defineProps({
  freeTables: Array as () => TableOption[],
  reservation: Object as () => { id: number } | undefined,
});

const emit = defineEmits(["onChosen"]);

const payload = ref<{ tableId: TableOption | null }>({
  tableId: null,
});

const errMsg = ref<string | null>(null);
const isSuccessful = ref(false);

const chooseTable = async () => {
  errMsg.value = null;
  isSuccessful.value = false;
  if (!props.reservation) return;
  try {
    await reservationAPI.chooseTable(
      props.reservation.id,
      payload.value.tableId
    );
    logger.debug("Table chosen", { reservationId: props.reservation.id });
    isSuccessful.value = true;
    emit("onChosen");
  } catch (err) {
    const error = err as { response?: { status?: number }; message?: string };
    if (error.response && error.response.status === 400) {
      emit("onChosen");
      errMsg.value = getApiErrorMessage(err);
    }
    logger.error("Choose table failed", { error: error.message });
  }
};
</script>

<template>
  <div>
    <form @submit.prevent="chooseTable">
      <va-select
        id="table"
        label="Table"
        placeholder="Choose a table..."
        :options="props.freeTables"
        v-model="payload.tableId"
        value-key="id"
        text-key="name"
      />
      <va-alert v-if="isSuccessful" color="success">
        Successfully reserved a table!
      </va-alert>
      <va-alert v-if="errMsg" color="danger">
        {{ errMsg }}
      </va-alert>
      <va-button preset="primary" @click="chooseTable()">
        <template #icon>
          <SaveIcon />
        </template>
        Done
      </va-button>
    </form>
  </div>
</template>

<style scoped></style>
