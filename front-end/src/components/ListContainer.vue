<script setup lang="ts">
import { VaAlert } from "vuestic-ui";

const props = defineProps<{
  collection: any[]
  filteredCollection: any[]
}>();
</script>

<template>
  <div v-if="props.collection">
    <VaAlert v-if="!props.filteredCollection.length" color="warning">
      Not Found
    </VaAlert>
    <div
      class="item-container"
      v-for="item in props.filteredCollection"
      :key="item.id"
    >
      <slot :item="item" name="card"></slot>
    </div>
  </div>
</template>

<style scoped>
.item-container {
  width: 100%;
}
</style>
