<script setup>
import { computed } from "vue";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

const props = defineProps({
  table: Object,
});

const emit = defineEmits(["onFreedTable"]);

const cssProps = computed(() => {
  return {
    "--columns": props.table.capacity,
  };
});

const freeTable = async (id) => {
  try {
    await tableAPI.freeTable(id);
    emit("onFreedTable");
    logger.debug("Table freed", { id });
  } catch (err) {
    logger.error("Free table failed", { error: err.message });
  }
};
</script>
<template>
  <div class="main-wrapper">
    <div class="header">
      <div>{{ props.table?.name }}</div>
      <div class="table-status" v-show="props.table.isOccupied">Occupied</div>
      <div
        class="free-table-button"
        v-show="props.table.isOccupied"
        @click="freeTable(props.table.id)"
      >
        Free
      </div>
    </div>
    <div class="content">
      <div class="seats-wrapper" :style="cssProps">
        <div
          class="circle"
          :class="{ blackColor: props.table.isOccupied }"
          v-for="seat in props.table?.capacity"
          :key="seat"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  background-color: #eef2ff;
  padding: 8px;
  width: 100%;
  height: auto;
  min-height: 90px;
  border-radius: 10px;
  transition: all 0.2s;
  border: 1px solid #dbeafe;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.main-wrapper .header {
  display: flex;
  justify-content: space-between;
  position: relative;
  align-items: center;
  gap: 6px;
  font-family: "Inter-Bold";
  color: #1e293b;
  font-size: 12px;
}
.header .table-status {
  background-color: transparent;
  color: #1e293b;
  font-family: "Inter-Light";
  font-size: 10px;
  border: 1px solid #cbd5e1;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 10px;
}
.header .free-table-button {
  position: relative;
  top: 0;
  right: 5px;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 20px;
  cursor: pointer;
  font-family: "Inter-Bold";
  transition: all 0.2s ease;
}
.free-table-button:hover {
  background-color: #ffffff;
  border-color: var(--color-info-600);
  color: var(--color-info-600);
}
.content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.seats-wrapper {
  margin-top: 6px;
  margin-bottom: 6px;
  display: flex;
  justify-content: center;
  gap: 6px;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
}

.circle {
  width: 12px;
  height: 12px;
  background-color: var(--surface);
  border: 2px solid #94a3b8;
  border-radius: 100%;
}
.blackColor {
  background-color: var(--ink);
}

@media screen and (min-width: 1024px) {
  .seats-wrapper {
    margin-top: 8px;
    width: 100%;
    margin-bottom: 8px;
  }
  .circle {
    width: 14px;
    height: 14px;
  }
}
</style>
