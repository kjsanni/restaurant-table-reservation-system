<script setup>
import CalendarIcon from "~icons/bi/calendar-date";
import PhoneIcon from "~icons/bxs/phone";
import ClockIcon from "~icons/ant-design/clock-circle-outlined";
import EmailIcon from "~icons/carbon/email";
import GroupIcon from "~icons/clarity/group-solid";
import TableIcon from "~icons/fluent/table-16-regular";
import DeleteIcon from "~icons/fluent/delete-16-regular";
import { RouterLink } from "vue-router";

import { computed } from "vue";

const props = defineProps({
  reservation: Object,
  canDelete: Boolean,
  searchQuery: String,
});

const emit = defineEmits(["onDelete"]);

const tableNames = computed(() => {
  const tables = props.reservation?.tables;
  if (!Array.isArray(tables) || tables.length === 0) return [];
  return tables.map((t) => t.name || `T${t.id}`).join(" + ");
});

const highlightedNotes = computed(() => {
  if (!props.searchQuery) return props.reservation?.notes || "";
  const notes = props.reservation?.notes;
  if (!notes) return "";
  const escaped = notes.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return notes.replace(regex, "<mark>$1</mark>");
});

const customerLink = computed(() => {
  if (props.reservation?.customerId) {
    return `/admin/customers/${props.reservation.customerId}`;
  }
  return null;
});
</script>

<template>
  <div class="wrapper">
    <div class="header-row">
      <component
        :is="customerLink ? RouterLink : 'p'"
        :to="customerLink"
        class="names"
      >
        {{ props.reservation.name }}
      </component>
      <button
        v-if="canDelete"
        type="button"
        class="delete-btn"
        @click="emit('onDelete', props.reservation.id)"
        title="Delete reservation"
      >
        <DeleteIcon />
      </button>
    </div>
    <div class="reservation-details">
      <div class="info-container">
        <CalendarIcon class="icon" />
        <p>{{ props.reservation.resDate }}</p>
      </div>
      <div class="info-container">
        <PhoneIcon class="icon" />
        <p>{{ props.reservation.phone }}</p>
      </div>
      <div class="info-container">
        <ClockIcon class="icon" />
        <p>{{ props.reservation.resTime }}</p>
      </div>
      <div class="info-container">
        <EmailIcon class="icon" />
        <p>{{ props.reservation.email }}</p>
      </div>
    </div>
    <div class="capacity-wrapper">
      <div class="info-container">
        <GroupIcon class="icon" />
        <p>{{ props.reservation.people }}</p>
      </div>
      <div v-if="tableNames" class="info-container">
        <TableIcon class="icon" />
        <p>{{ tableNames }}</p>
      </div>
    </div>
    <div v-if="props.reservation.notes" class="notes-wrapper">
      <p class="notes-label">Notes:</p>
      <p class="notes-text" v-html="highlightedNotes"></p>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  background-color: var(--primary-white);
  padding: 10px 15px;
  border: 1px solid var(--lighter-gray);
  border-radius: 10px;
}

.wrapper .reservation-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  padding-left: 25px;
  margin-bottom: 15px;
  font-family: "Inter-Medium";
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.names {
  font-family: "Inter-Bold";
  font-size: 16px;
  margin: 0;
  flex: 1;
  color: var(--primary-black);
  text-decoration: none;
}

.names:hover {
  color: var(--primary-blue);
  text-decoration: underline;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #fef2f2;
}

.delete-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.capacity-wrapper {
  display: flex;
  justify-content: center;
  font-family: "Inter-Medium";
}

.notes-wrapper {
  margin-top: 8px;
  padding-left: 25px;
}

.notes-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.notes-text {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.notes-text :deep(mark) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 1px 3px;
  border-radius: 3px;
}

.info-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}

.icon {
  font-size: 18px;
}

@media screen and (min-width: 1024px) {
  .icon {
    font-size: 25px;
  }
}
</style>
