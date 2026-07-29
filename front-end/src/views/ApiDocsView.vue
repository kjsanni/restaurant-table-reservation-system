<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

const router = useRouter();
const spec = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");

onMounted(async () => {
  try {
    const response = await fetch("/api/v1/docs/openapi.json");
    const data = await response.json();
    if (data) {
      spec.value = data;
    } else {
      error.value = "Failed to load API documentation.";
    }
  } catch {
    error.value = "Unable to load API documentation. Please try again later.";
  } finally {
    loading.value = false;
  }
});

const endpoints = ref<
  Array<{ path: string; method: string; summary: string; tag: string }>
>([]);

const extractEndpoints = () => {
  if (!spec.value?.paths) return;
  const result: Array<{
    path: string;
    method: string;
    summary: string;
    tag: string;
  }> = [];
  for (const [path, methods] of Object.entries(spec.value.paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      const detail = details as any;
      result.push({
        path,
        method: method.toUpperCase(),
        summary: detail.summary || detail.description || "",
        tag: detail.tags?.[0] || "General",
      });
    }
  }
  endpoints.value = result.sort((a, b) => a.path.localeCompare(b.path));
};

watch(
  () => spec.value,
  () => {
    extractEndpoints();
  }
);

const filteredEndpoints = computed(() => {
  if (!searchQuery.value) return endpoints.value;
  const q = searchQuery.value.toLowerCase();
  return endpoints.value.filter(
    (ep) =>
      ep.path.toLowerCase().includes(q) ||
      ep.summary.toLowerCase().includes(q) ||
      ep.tag.toLowerCase().includes(q)
  );
});

const methodColor = (method: string) => {
  switch (method) {
    case "GET":
      return "#4d7c0f";
    case "POST":
      return "#2563eb";
    case "PUT":
      return "#d97706";
    case "PATCH":
      return "#9333ea";
    case "DELETE":
      return "#e11d48";
    default:
      return "#4a4540";
  }
};
</script>

<template>
  <div class="docs-root">
    <nav class="docs-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:api" width="28" height="28" />
          <span>Vibespot API Docs</span>
        </div>
        <div class="nav-actions">
          <button class="nav-link" @click="router.push('/')">Home</button>
          <button class="nav-link" @click="router.push('/pricing')">
            Pricing
          </button>
        </div>
      </div>
    </nav>

    <main class="docs-main">
      <div class="docs-header">
        <h1>API Reference</h1>
        <p>
          RESTful API for integrating with Vibespot. Base URL:
          <code>/api/v1</code>
        </p>
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search endpoints..."
          />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Loading API documentation...
      </div>
      <div v-else-if="error" class="error-state">{{ error }}</div>

      <div v-else class="endpoints-section">
        <div v-if="filteredEndpoints.length === 0" class="empty-state">
          No endpoints match your search.
        </div>

        <div
          v-for="(endpoint, index) in filteredEndpoints"
          :key="index"
          class="endpoint-card"
        >
          <div class="endpoint-header">
            <span
              class="method-badge"
              :style="{ background: methodColor(endpoint.method) }"
            >
              {{ endpoint.method }}
            </span>
            <code class="endpoint-path">{{ endpoint.path }}</code>
          </div>
          <div class="endpoint-body">
            <p class="endpoint-summary">{{ endpoint.summary }}</p>
            <span class="endpoint-tag">{{ endpoint.tag }}</span>
          </div>
        </div>
      </div>

      <section class="auth-section">
        <h2>Authentication</h2>
        <p>
          Authenticate using a JWT bearer token in the Authorization header:
        </p>
        <pre class="code-block">
Authorization: Bearer &lt;your-jwt-token&gt;</pre>
        <p>
          Tokens are obtained via <code>/auth/login</code> and expire after 30
          minutes. Use the refresh token endpoint to obtain a new access token.
        </p>
      </section>

      <section class="errors-section">
        <h2>Error Codes</h2>
        <div class="error-table">
          <div class="error-row">
            <code>400</code>
            <span>Bad request — missing or invalid parameters</span>
          </div>
          <div class="error-row">
            <code>401</code>
            <span>Unauthorized — missing or expired JWT</span>
          </div>
          <div class="error-row">
            <code>403</code>
            <span>Forbidden — insufficient permissions</span>
          </div>
          <div class="error-row">
            <code>404</code>
            <span>Not found — resource does not exist</span>
          </div>
          <div class="error-row">
            <code>409</code>
            <span>Conflict — duplicate resource (e.g., email or slug)</span>
          </div>
          <div class="error-row">
            <code>429</code>
            <span>Too many requests — rate limit exceeded</span>
          </div>
          <div class="error-row">
            <code>500</code>
            <span>Internal server error</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="docs-footer">
      <p>© 2026 Vibespot Technologies Ltd. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.docs-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
}
.docs-nav {
  background: #ffffff;
  border-bottom: 1px solid #e7e4de;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  color: #1a1410;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-link {
  background: transparent;
  border: none;
  color: #4a4540;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
}
.nav-link:hover {
  background: #f3f1ed;
}
.docs-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.docs-header {
  margin-bottom: 2rem;
}
.docs-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: #1a1410;
}
.docs-header p {
  margin: 0 0 1rem;
  color: #645d54;
}
.search-box {
  margin-top: 1rem;
}
.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d6d1c9;
  border-radius: 0.5rem;
  font-size: 0.95rem;
}
.search-box input:focus {
  outline: none;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
}
.error-state {
  color: #e11d48;
}
.endpoints-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}
.endpoint-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  overflow: hidden;
}
.endpoint-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #faf9f7;
  border-bottom: 1px solid #e7e4de;
}
.method-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.3rem;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}
.endpoint-path {
  font-size: 0.95rem;
  color: #1a1410;
  font-weight: 500;
}
.endpoint-body {
  padding: 1rem;
}
.endpoint-summary {
  margin: 0 0 0.5rem;
  color: #4a4540;
}
.endpoint-tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: #f3f1ed;
  color: #7d766c;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.auth-section,
.errors-section {
  margin-bottom: 2rem;
}
.auth-section h2,
.errors-section h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #1a1410;
}
.auth-section p {
  color: #4a4540;
  margin: 0 0 0.75rem;
}
.code-block {
  background: #1a1410;
  color: #fbbf24;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.9rem;
}
.error-table {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  overflow: hidden;
}
.error-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e7e4de;
}
.error-row:last-child {
  border-bottom: none;
}
.error-row code {
  background: #f3f1ed;
  padding: 0.25rem 0.5rem;
  border-radius: 0.3rem;
  font-weight: 600;
  color: #e11d48;
  min-width: 60px;
  text-align: center;
}
.error-row span {
  color: #4a4540;
  font-size: 0.9rem;
}
.docs-footer {
  text-align: center;
  padding: 2rem;
  color: #9a9389;
  font-size: 0.9rem;
  border-top: 1px solid #e7e4de;
}
</style>
