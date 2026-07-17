<script setup>
import { ref, onMounted, watch } from "vue";
import TheSearch from "@/components/TheSearch.vue";
import SearchSkeleton from "@/components/SearchSkeleton.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const loading = ref(false);
const results = ref([]);
const query = ref("");
const resultsCount = ref(0);
const searched = ref(false);

const loadResults = async () => {
  if (!query.value.trim()) {
    results.value = [];
    resultsCount.value = 0;
    searched.value = false;
    return;
  }
  loading.value = true;
  searched.value = true;
  try {
    const res = await fetch(
      `/api/v1/reservations/search?q=${encodeURIComponent(query.value.trim())}`
    );
    const data = await res.json();
    if (data.success) {
      results.value = data.results || [];
      resultsCount.value = results.value.length;
    } else {
      results.value = [];
      resultsCount.value = 0;
    }
  } catch {
    results.value = [];
    resultsCount.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(query, loadResults);

onMounted(() => {
  if (route.query.q) {
    query.value = route.query.q;
    loadResults();
  }
});
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Search Reservations</h1>
      <p class="subtitle">
        Search by name, phone, email, date, time, notes, or table
      </p>
    </div>
    <div class="content-wrapper">
      <TheSearch v-model:query="query" :loading="loading" />
      <div v-if="searched" class="results-meta">
        <span class="results-count" v-if="resultsCount > 0">
          {{ resultsCount }} result{{ resultsCount !== 1 ? "s" : "" }} for "{{
            query
          }}"
        </span>
        <span class="results-count" v-else>
          No results found for "{{ query }}"
        </span>
      </div>
      <div v-if="loading" class="loading-state">
        <SearchSkeleton />
      </div>
      <div v-else-if="results.length === 0 && searched" class="empty-state">
        <span class="empty-icon">🔍</span>
        <p>No reservations matched your search.</p>
      </div>
      <div v-else-if="results.length > 0" class="results-list">
        <div v-for="res in results" :key="res.id" class="result-card">
          <div class="result-header">
            <RouterLink
              :to="`/admin/customers/${res.customerId}`"
              class="result-name"
            >
              {{ res.name || res.customer?.name || "Guest" }}
            </RouterLink>
            <span class="status-chip" :class="res.resStatus">
              {{ res.resStatus }}
            </span>
          </div>
          <div class="result-meta">
            <span>{{ res.resDate }}</span>
            <span>{{ res.resTime?.slice(0, 5) }}</span>
            <span>{{ res.people }} guests</span>
            <span v-if="res.paymentStatus" class="payment-chip">
              {{ res.paymentStatus }}
            </span>
            <span v-if="res.table?.name">Table: {{ res.table.name }}</span>
            <span v-if="res.name">Email: {{ res.email }}</span>
            <span v-if="res.phone">Phone: {{ res.phone }}</span>
          </div>
          <div v-if="res.notes" class="result-notes">
            {{ res.notes }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
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

.subtitle {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
}

.loading-state {
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.results-meta {
  margin-bottom: 16px;
}

.results-count {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--secondary-gray);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.result-name {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-blue);
  text-decoration: none;
}

.result-name:hover {
  text-decoration: underline;
}

.status-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: white;
  text-transform: uppercase;
}

.result-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
}

.payment-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e5e7eb;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--primary-black);
  text-transform: capitalize;
}

.result-notes {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }

  .subtitle {
    margin-left: var(--x-spacing-desktop);
  }

  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
