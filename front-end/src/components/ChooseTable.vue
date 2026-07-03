<script setup lang="ts">
import SaveIcon from "~icons/fluent/save-16-regular";

import reservationAPI from "@/services/reservationAPI";
import { ref } from "vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";

const props = defineProps({
  freeTables: Array,
  reservation: Object,
});

const emit = defineEmits(["onChosen"]);

const payload = ref({
  tableId: null,
});

const errMsg = ref(null);
const isSuccessful = ref(false);

const chooseTable = async () => {
  errMsg.value = null;
  isSuccessful.value = false;
  try {
    const res = await reservationAPI.chooseTable(
      props.reservation.id,
      payload.value.tableId
    );
    logger.debug("Table chosen", { reservationId: props.reservation.id });
    isSuccessful.value = true;
    emit("onChosen");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      emit("onChosen");
      errMsg.value = getApiErrorMessage(err);
    }
    logger.error("Choose table failed", { error: err.message });
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
