<template>
  <nav v-if="totalPages > 1" class="sa-pagination" aria-label="Pagination">
    <button
      type="button"
      class="sa-pagination-btn"
      :disabled="currentPage <= 1"
      @click="$emit('update:page', currentPage - 1)"
    >
      Previous
    </button>

    <ol class="sa-pagination-list">
      <li v-for="page in visiblePages" :key="page" class="sa-pagination-item">
        <button
          v-if="page !== '...'"
          type="button"
          class="sa-pagination-page"
          :class="{ 'sa-pagination-page--active': page === currentPage }"
          :disabled="page === currentPage"
          @click="$emit('update:page', page)"
          :aria-current="page === currentPage ? 'page' : undefined"
        >
          {{ page }}
        </button>
        <span v-else class="sa-pagination-ellipsis" aria-hidden="true">…</span>
      </li>
    </ol>

    <button
      type="button"
      class="sa-pagination-btn"
      :disabled="currentPage >= totalPages"
      @click="$emit('update:page', currentPage + 1)"
    >
      Next
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

defineEmits<{
  (e: "update:page", page: number): void;
}>();

const visiblePages = computed(() => {
  const { currentPage, totalPages } = props;
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];
  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("...");

  pages.push(totalPages);
  return pages;
});
</script>

<style scoped>
.sa-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4) var(--space-4);
  flex-wrap: wrap;
}

.sa-pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  transition: all var(--duration-150) var(--ease-in-out);
}

.sa-pagination-btn:hover:not(:disabled) {
  background: var(--neutral-100);
  border-color: var(--border-strong);
}

.sa-pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sa-pagination-list {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.sa-pagination-item {
  display: inline-flex;
}

.sa-pagination-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink);
  transition: all var(--duration-150) var(--ease-in-out);
}

.sa-pagination-page:hover:not(:disabled) {
  background: var(--neutral-100);
  border-color: var(--border);
}

.sa-pagination-page--active {
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  border-color: transparent;
}

.sa-pagination-page--active:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
}

.sa-pagination-page:disabled {
  cursor: default;
}

.sa-pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  user-select: none;
}
</style>
